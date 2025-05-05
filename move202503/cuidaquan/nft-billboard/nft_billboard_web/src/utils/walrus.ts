import { WalrusClient } from '@mysten/walrus';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import type { WriteBlobOptions, ExtendBlobOptions } from '@mysten/walrus';
import type { Signer } from '@mysten/sui/cryptography';
import { WALRUS_CONFIG, getWalrusAggregatorUrl, getEpochDuration } from '../config/walrusConfig';

/**
 * 自定义签名器接口，兼容性更强
 */
export interface CustomSigner {
  signTransaction?: (tx: any) => Promise<any>;
  toSuiAddress: () => string;
  address?: string;
}

/**
 * Walrus服务类：负责与Walrus存储交互
 */
export class WalrusService {
  private client!: WalrusClient;
  private suiClient!: SuiClient;
  private readonly MAX_RETRIES = WALRUS_CONFIG.MAX_RETRIES;
  private readonly RETRY_DELAY = WALRUS_CONFIG.RETRY_DELAY;
  private walrusAggregatorUrl: string;

  constructor() {
    // 从配置获取网络类型
    const network = WALRUS_CONFIG.ENVIRONMENT;
    console.log('初始化 Walrus 服务，网络环境:', network);

    // 从配置获取聚合器URL
    this.walrusAggregatorUrl = getWalrusAggregatorUrl(network);
    console.log('Walrus 聚合器 URL:', this.walrusAggregatorUrl);

    // 初始化 SUI 客户端
    this.suiClient = new SuiClient({
      url: getFullnodeUrl(network),
    });

    try {
      // 初始化 Walrus 客户端
      this.client = new WalrusClient({
        // 网络环境配置
        network: network,
        // 由于类型不兼容问题，使用类型断言
        suiClient: this.suiClient as any,
        // 使用配置的WASM URL
        wasmUrl: WALRUS_CONFIG.WASM_URL,
        storageNodeClientOptions: {
          timeout: WALRUS_CONFIG.REQUEST_TIMEOUT,
          // 调整fetch参数类型
          fetch: ((url: RequestInfo, options?: RequestInit) =>
            this.fetchWithRetry(url.toString(), options || {}, this.MAX_RETRIES)) as any
        }
      });

      console.log('Walrus 客户端初始化完成');
    } catch (err) {
      console.error('Walrus 客户端初始化失败:', err);
    }
  }

  /**
   * 延迟指定时间
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 带重试的fetch请求
   */
  private async fetchWithRetry(url: string, options: any, retries = this.MAX_RETRIES): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(WALRUS_CONFIG.REQUEST_TIMEOUT)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${response.statusText}\n${errorText}`);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        console.log(`请求失败，${retries}次重试机会剩余，等待${this.RETRY_DELAY}ms后重试...`);
        await this.delay(this.RETRY_DELAY);
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  /**
   * 上传文件到Walrus
   * @param file 要上传的文件
   * @param duration 存储时长(秒)
   * @param address 钱包地址
   * @param signer 签名对象
   * @returns Promise<{blobId: string, url: string}>
   */
  async uploadFile(
    file: File,
    duration: number,
    address: string,
    signer: Signer | CustomSigner,
    leaseDays?: number // 添加租赁天数参数，用于日志记录
  ): Promise<{ blobId: string, url: string }> {
    try {
      console.log(`正在上传文件到Walrus: ${file.name}, 大小: ${file.size} 字节`);

      // 将文件转换为 Uint8Array
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // 获取当前环境的epoch时长
      const epochDuration = getEpochDuration();
      const epochDurationDays = epochDuration / (24 * 60 * 60);

      // 计算存储时长（转换为epoch数）
      const epochs = Math.ceil(duration / epochDuration);
      const durationDays = duration / (24 * 60 * 60);

      console.log(`当前环境: ${WALRUS_CONFIG.ENVIRONMENT}, Epoch时长: ${epochDurationDays}天`);
      console.log(`文件将存储 ${epochs} 个epochs（总计约${(epochs * epochDurationDays).toFixed(2)}天），原始时长: ${durationDays.toFixed(2)}天 (${duration}秒)`);

      // 如果存储时长超过租赁天数，记录额外的存储时间
      if (leaseDays !== undefined && durationDays > leaseDays) {
        console.log(`注意: 存储时长(${durationDays.toFixed(2)}天)超过了租赁天数(${leaseDays}天)，这可能是因为设置了未来的开始时间`);
      }

      try {
        console.log('开始写入blob数据至Walrus存储网络...');

        /**
         * WriteBlobOptions类型定义参照:
         * https://sdk.mystenlabs.com/typedoc/types/_mysten_walrus.WriteBlobOptions.html
         */
        const writeBlobOptions: WriteBlobOptions = {
          blob: uint8Array,
          deletable: true,
          epochs: epochs,
          signer: signer as any, // 使用类型断言解决类型兼容性问题
          attributes: {
            filename: file.name,
            contentType: file.type,
            size: file.size.toString(),
            lastModified: new Date(file.lastModified).toISOString(),
            uploadTime: new Date().toISOString(),
            origin: window.location.origin || 'unknown'
          },
          // 使用signer的地址作为owner
          owner: signer.toSuiAddress()
        };

        console.log('正在执行blob上传，参数:', JSON.stringify({
          fileSize: file.size,
          fileType: file.type,
          epochs: epochs,
          owner: signer.toSuiAddress(),
          attributes: writeBlobOptions.attributes
        }));

        const result = await this.client.writeBlob(writeBlobOptions);

        if (!result || !result.blobId) {
          throw new Error('文件上传失败：未获取到有效的blob信息');
        }

        const { blobId, blobObject } = result;

        console.log(`文件上传成功, Blob ID: ${blobId}`, blobObject ? `对象ID: ${blobObject.id?.id}` : '');

        // 获取blob URL
        let url = '';
        try {
          const objectId = blobObject?.id?.id;
          // 使用改进的getBlobUrl方法，优先使用objectId
          if (objectId) {
            url = await this.getBlobUrl(objectId);
            console.log(`成功获取Blob URL: ${url}`);
          } else {
            throw new Error('未获取到有效的对象ID');
          }
        } catch (e) {
          console.warn('无法通过对象ID获取blob URL:', e);
        }

        if (!url) {
          throw new Error('无法生成有效的Blob URL');
        }

        return { blobId, url };
      } catch (uploadError) {
        console.error('Walrus blob上传错误:', uploadError);
        const errorMessage = uploadError instanceof Error ? uploadError.message : '未知错误';
        throw new Error(`Blob上传失败: ${errorMessage}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'RetryableWalrusClientError') {
        console.log('遇到可重试错误，重置客户端后重试...');
        (this.client as any).reset();
        // 重新尝试上传
        return this.uploadFile(file, duration, address, signer);
      }
      throw error;
    }
  }


  /**
   * 获取Blob的URL
   * @param objectId Blob对象的ID
   * @returns Promise<string>
   */
  async getBlobUrl(objectId?: string): Promise<string> {
    try {
      // 使用Object ID方式构建URL (推荐方式)
      if (objectId) {
        console.log(`使用对象ID ${objectId} 构建URL`);
        return `${this.walrusAggregatorUrl}${objectId}`;
      }

      // 如果没有objectId，返回错误信息
      console.warn('未提供对象ID，无法构建URL');
      throw new Error('缺少对象ID，无法生成Walrus URL');
    } catch (e) {
      console.error('获取Blob URL时出错:', e);
      throw new Error(`无法获取Blob URL: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  /**
   * 从Walrus URL中提取对象ID
   * @param url Walrus URL
   * @returns 对象ID或null
   */
  extractObjectIdFromUrl(url: string): string | null {
    try {
      if (!url) return null;

      let objectId: string | null = null;

      // 直接通过URL路径分割获取最后一部分作为objectId
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];

      if (lastPart && (lastPart.startsWith('0x') || /^[0-9a-fA-F]{64}$/.test(lastPart))) {
        // 确保对象ID以0x开头
        objectId = lastPart.startsWith('0x') ? lastPart : '0x' + lastPart;
      } else {
        // 如果最后一部分不是有效的对象ID，尝试从整个URL中提取
        const match = url.match(/([0-9a-fA-F]{64}|0x[0-9a-fA-F]{64})/);
        if (match && match[1]) {
          objectId = match[1].startsWith('0x') ? match[1] : '0x' + match[1];
        }
      }

      console.log(`从URL [${url}] 提取的对象ID: ${objectId}`);
      return objectId;
    } catch (error) {
      console.error('从URL提取对象ID失败:', error);
      return null;
    }
  }

  /**
   * 删除Walrus上的内容
   *
   * 根据Walrus SDK文档，删除Blob需要使用executeDeleteBlobTransaction方法，
   * 该方法接收blobObjectId和signer参数。
   *
   * DeleteBlobOptions接口定义：
   * ```typescript
   * interface DeleteBlobOptions {
   *   blobObjectId: string; // 必须是从URL中解析出的对象ID
   * }
   * ```
   *
   * 参考文档：
   * - https://sdk.mystenlabs.com/typedoc/classes/_mysten_walrus.WalrusClient.html#executedeleteblobtransaction
   * - https://sdk.mystenlabs.com/typedoc/interfaces/_mysten_walrus.DeleteBlobOptions.html
   *
   * 使用示例：
   * ```typescript
   * const { digest } = await client.executeDeleteBlobTransaction({ blobObjectId, signer });
   * ```
   *
   * @param contentUrl 内容URL或blobId
   * @param signer 签名对象
   * @returns Promise<boolean> 操作成功返回true，失败抛出异常
   */
  async deleteBlob(
    contentUrl: string,
    signer: Signer | CustomSigner
  ): Promise<boolean> {
    try {
      console.log(`正在删除Walrus内容，URL: ${contentUrl}`);

      // 从URL中提取对象ID（如果传入的是URL）
      // 使用extractObjectIdFromUrl方法解析URL中的对象ID
      // 该方法会处理以下情况：
      // 1. 直接传入对象ID（以0x开头或64位十六进制字符串）
      // 2. 传入完整的Walrus URL，如https://walrus-aggregator.testnet.sui.io/0x123...
      // 3. 从URL路径的最后一部分提取对象ID
      const blobObjectId = this.extractObjectIdFromUrl(contentUrl);

      // 如果无法从URL中提取对象ID，则使用原始输入（可能是直接的对象ID）
      const finalBlobId = blobObjectId || contentUrl;

      // 验证最终的blobObjectId格式是否正确
      if (!finalBlobId.startsWith('0x') && !/^[0-9a-fA-F]{64}$/.test(finalBlobId)) {
        throw new Error(`无效的Blob对象ID: ${finalBlobId}。对象ID必须是以0x开头的64位十六进制字符串。`);
      }

      console.log(`使用blobObjectId: ${finalBlobId} 执行删除操作`);

      // 准备执行删除交易
      console.log('准备执行删除Blob交易，参数:', {
        blobObjectId: finalBlobId,
        owner: signer.toSuiAddress()
      });

      // 直接使用executeDeleteBlobTransaction方法执行删除交易
      // 该方法需要一个包含blobObjectId和signer的对象
      const result = await this.client.executeDeleteBlobTransaction({
        blobObjectId: finalBlobId,
        signer: signer as any
      });

      if (!result || !result.digest) {
        throw new Error('删除Walrus内容失败：未获取到有效的响应');
      }

      console.log('Walrus内容删除成功，交易摘要:', result.digest);
      return true;
    } catch (error) {
      console.error('删除Walrus内容失败:', error);

      // 检查是否是权限错误
      if (error instanceof Error &&
          (error.message.includes('authority') ||
           error.message.includes('permission') ||
           error.message.includes('owner'))) {
        throw new Error(`删除Walrus内容失败：您没有权限删除此Blob。只有Blob的所有者才能删除其内容。`);
      }

      // 检查是否是gas不足错误
      if (error instanceof Error && error.message.includes('gas')) {
        throw new Error(`删除Walrus内容失败：Gas不足。请确保您的钱包中有足够的SUI代币支付交易费用。`);
      }

      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`删除Walrus内容失败: ${errorMessage}`);
    }
  }

  /**
   * 延长Walrus存储期限
   *
   * 参考文档：
   * - https://sdk.mystenlabs.com/typedoc/classes/_mysten_walrus.WalrusClient.html#executeextendblobtransaction
   * - https://sdk.mystenlabs.com/typedoc/types/_mysten_walrus.ExtendBlobOptions.html
   *
   * @param contentUrl 内容URL或Sui对象ID
   * @param duration 延长的存储时长(秒)
   * @param signer 签名对象
   * @param nftEndTime NFT的结束时间（秒，Unix时间戳），用于判断是否需要延长Walrus存储
   * @returns Promise<boolean> 操作成功返回true，失败抛出异常
   */
  async extendStorageDuration(
    contentUrl: string,
    duration: number,
    signer: Signer | CustomSigner,
    nftEndTime: number
  ): Promise<boolean> {
    try {
      console.log(`正在延长Walrus存储期限，URL/ID: ${contentUrl}, 延长时间: ${duration}秒, NFT结束时间: ${nftEndTime} (${new Date(nftEndTime * 1000).toLocaleString()})`);

      // 从URL中提取对象ID
      const objectId = this.extractObjectIdFromUrl(contentUrl);

      if (!objectId) {
        throw new Error(`无法从URL [${contentUrl}] 中提取有效的对象ID`);
      }

      console.log(`成功提取对象ID: ${objectId}`);


        // 检查是否需要延长存储期限
        try {
          // 使用传入的nftEndTime参数
          const { needExtend, currentEndEpoch, targetEndEpoch, epochsToAdd } =
            await this.checkNeedExtendStorage(objectId, duration, nftEndTime);

          if (!needExtend) {
            console.log(`Blob存储期限已足够，无需延长。当前结束epoch: ${currentEndEpoch}, 目标结束epoch: ${targetEndEpoch}`);
            return true; // 返回成功，因为已经满足要求
          }

          console.log(`将使用计算出的目标结束epoch: ${targetEndEpoch} (增加${epochsToAdd}个epochs)`);
        } catch (checkError) {
          console.warn('检查存储期限时出错，将使用默认方式延长:', checkError);
        }

      // 准备交易参数
      const owner = signer.toSuiAddress();

      // 根据options决定使用哪种模式构造ExtendBlobOptions参数
      let transactionParams: ExtendBlobOptions & { signer: any };


        // 使用epochs模式（增加存储时间）
        // 使用getEpochDuration获取当前环境的epoch时长
        const epochDuration = getEpochDuration();
        const epochs = Math.ceil(duration / epochDuration);
        const durationDays = duration / (24 * 60 * 60);
        console.log(`使用epochs模式延长存储期限，增加 ${epochs} 个epochs（约${durationDays.toFixed(2)}天），原始时长: ${duration}秒`);

        // 构造使用epochs的参数
        transactionParams = {
          blobObjectId: objectId,
          owner,
          epochs,
          signer: signer as any // 使用类型断言解决类型兼容性问题
        };

      try {

        // 执行延长存储期限交易
        const result = await this.client.executeExtendBlobTransaction(transactionParams);

        if (!result) {
          throw new Error('延长存储期限失败：未获取到有效的响应');
        }

        console.log('Walrus存储期限延长成功，交易摘要:', result.digest);
        return true;
      } catch (txError) {
        console.error('执行延长存储期限交易失败:', txError);

        // 检查是否是toJSON错误
        if (txError instanceof Error && txError.message.includes('toJSON is not a function')) {
          console.log('检测到toJSON错误，这可能是由于SDK版本不兼容导致的');

          // 尝试使用替代方法
          console.log('尝试使用替代方法延长存储期限...');

          // 这里可以添加替代实现，例如直接调用Walrus API
          // 由于无法直接修改Walrus SDK，我们可以提供一个友好的错误消息
          throw new Error('当前版本的Walrus SDK与应用不兼容，请联系管理员更新SDK');
        }

        // 检查是否是权限错误
        if (txError instanceof Error &&
            (txError.message.includes('authority') ||
             txError.message.includes('permission') ||
             txError.message.includes('owner'))) {
          throw new Error(`延长存储期限失败：您没有权限操作此Blob。只有Blob的所有者才能延长其存储期限。`);
        }

        // 检查是否是gas不足错误
        if (txError instanceof Error && txError.message.includes('gas')) {
          throw new Error(`延长存储期限失败：Gas不足。请确保您的钱包中有足够的SUI代币支付交易费用。`);
        }

        // 重新抛出原始错误
        throw txError;
      }
    } catch (error) {
      console.error('延长Walrus存储期限失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`延长存储期限失败: ${errorMessage}`);
    }
  }

  /**
   * 获取Walrus Blob的到期时间信息
   * @param objectId Sui对象ID，指向Walrus存储对象
   * @returns Promise<{currentEpoch: number, endEpoch: number, remainingEpochs: number}>
   */
  async getBlobExpirationInfo(objectId: string): Promise<{
    currentEpoch: number,
    endEpoch: number,
    remainingEpochs: number
  }> {
    try {
      console.log(`正在获取Blob到期信息，对象ID: ${objectId}`);

      // 获取当前系统状态，包含当前epoch
      let currentEpoch: number | undefined;
      let endEpoch: number | undefined;

      // 使用SuiClient.getObject获取blob状态
      try {
        // 获取当前系统状态
        const systemState = await this.client.systemState();

        // 详细打印systemState的结构，方便调试
        console.log('===== systemState返回数据开始 =====');
        console.log('systemState类型:', typeof systemState);
        console.log('systemState instanceof Object:', systemState instanceof Object);
        console.log('systemState.constructor.name:', systemState.constructor.name);
        console.log('systemState完整数据:', JSON.stringify(systemState, null, 2));

        // 打印systemState的所有顶级属性
        console.log('systemState顶级属性:');
        for (const key in systemState) {
          console.log(`  ${key}:`, (systemState as any)[key]);
        }

        // 尝试打印可能包含epoch的路径
        console.log('可能的epoch路径:');
        console.log('  systemState.committee?.epoch:', systemState.committee?.epoch);
        console.log('  systemState.epoch:', (systemState as any).epoch);
        console.log('  systemState.current_epoch:', (systemState as any).current_epoch);
        console.log('===== systemState返回数据结束 =====');

        currentEpoch = systemState.committee?.epoch;
        console.log(`当前Walrus epoch: ${currentEpoch}`);

        // 获取blob对象
        const response = await this.suiClient.getObject({
          id: objectId,
          options: { showContent: true }
        });

        if (response.data && response.data.content) {
          // 详细打印response的结构，方便调试
          console.log('===== getObject返回数据开始 =====');
          console.log('response.data类型:', typeof response.data);
          console.log('response.data instanceof Object:', response.data instanceof Object);
          console.log('response.data.constructor.name:', response.data.constructor.name);
          console.log('response.data完整数据:', JSON.stringify(response.data, null, 2));

          // 打印response.data的所有顶级属性
          console.log('response.data顶级属性:');
          for (const key in response.data) {
            console.log(`  ${key}:`, (response.data as any)[key]);
          }

          // 打印content的结构
          const content = response.data.content as any;
          console.log('content类型:', typeof content);
          console.log('content顶级属性:');
          for (const key in content) {
            console.log(`  ${key}:`, content[key]);
          }

          // 尝试打印可能包含end_epoch的路径
          console.log('可能的end_epoch路径:');
          console.log('  content.fields?.storage?.fields?.end_epoch:', content.fields?.storage?.fields?.end_epoch);
          console.log('  content.fields?.blob_id:', content.fields?.blob_id);
          console.log('  content.fields?.registered_epoch:', content.fields?.registered_epoch);
          console.log('===== getObject返回数据结束 =====');

          // 根据日志输出，正确的路径是 content.fields.storage.fields.end_epoch
          const blobContent = response.data.content as any;
          endEpoch = blobContent.fields?.storage?.fields?.end_epoch;

          console.log(`提取到的end_epoch: ${endEpoch}`);

        }
      } catch (error) {
        console.error('获取Blob状态或系统状态失败:', error);
        throw new Error('无法获取Blob状态或系统状态信息');
      }

      if (endEpoch === undefined) {
        throw new Error(`无法获取Blob的到期信息: ${objectId}`);
      }

      if (currentEpoch === undefined) {
        throw new Error('无法获取当前epoch信息');
      }

      // 计算剩余的epoch数
      const remainingEpochs = Math.max(0, endEpoch - currentEpoch);

      console.log(`Blob到期信息: 当前epoch=${currentEpoch}, 结束epoch=${endEpoch}, 剩余=${remainingEpochs}`);

      return {
        currentEpoch,
        endEpoch,
        remainingEpochs
      };
    } catch (error) {
      console.error('获取Blob到期信息失败:', error);
      throw new Error(`获取Blob到期信息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 检查是否需要延长Walrus存储期限
   * @param objectId Sui对象ID，指向Walrus存储对象
   * @param desiredDuration 期望的存储时长（秒）
   * @param nftEndTime NFT的结束时间（秒，Unix时间戳）
   * @returns Promise<{needExtend: boolean, currentEndEpoch: number, targetEndEpoch: number, epochsToAdd: number}>
   */
  async checkNeedExtendStorage(
    objectId: string,
    desiredDuration: number,
    nftEndTime: number
  ): Promise<{
    needExtend: boolean,
    currentEndEpoch: number,
    targetEndEpoch: number,
    epochsToAdd: number
  }> {
    try {
      console.log(`检查是否需要延长存储期限，对象ID: ${objectId}, 期望延长时间: ${desiredDuration}秒`);

      // 获取当前时间（秒）
      const currentTime = Math.floor(Date.now() / 1000);
      console.log(`当前时间: ${currentTime} (${new Date(currentTime * 1000).toLocaleString()})`);

      // 记录NFT结束时间
      console.log(`NFT结束时间: ${nftEndTime} (${new Date(nftEndTime * 1000).toLocaleString()})`);
      console.log(`NFT剩余时间: ${nftEndTime - currentTime}秒 (${((nftEndTime - currentTime) / (24 * 60 * 60)).toFixed(2)}天)`);

      // 计算NFT延长后的结束时间
      const nftNewEndTime = nftEndTime + desiredDuration;
      console.log(`NFT延长后的结束时间: ${nftNewEndTime} (${new Date(nftNewEndTime * 1000).toLocaleString()})`);

      // 获取blob的到期信息
      const { currentEpoch, endEpoch } = await this.getBlobExpirationInfo(objectId);
      console.log(`当前epoch=${currentEpoch}, 当前结束epoch=${endEpoch}`);

      // 获取当前环境的epoch时长
      const epochDuration = getEpochDuration();
      console.log(`当前环境的epoch时长: ${epochDuration}秒`);

      // 计算Walrus存储剩余时间（秒）
      const walrusRemainingEpochs = endEpoch - currentEpoch;
      const walrusRemainingSeconds = walrusRemainingEpochs * epochDuration;
      console.log(`Walrus存储剩余时间: ${walrusRemainingEpochs}个epochs (${walrusRemainingSeconds}秒, ${(walrusRemainingSeconds / (24 * 60 * 60)).toFixed(2)}天)`);

      // 计算Walrus存储延长后的剩余时间（秒）
      const walrusNewRemainingSeconds = walrusRemainingSeconds + desiredDuration;
      console.log(`Walrus存储延长后的剩余时间: ${walrusNewRemainingSeconds}秒 (${(walrusNewRemainingSeconds / (24 * 60 * 60)).toFixed(2)}天)`);

      // 判断是否需要延长Walrus存储
      let needExtend = false;
      let epochsToAdd = 0;

      // 比较NFT延长后的结束时间和Walrus存储当前剩余时间
      const nftRemainingAfterExtend = nftNewEndTime - currentTime;

      // 如果NFT延长后的剩余时间大于Walrus存储当前剩余时间，则需要延长Walrus存储
      if (nftRemainingAfterExtend > walrusRemainingSeconds) {
        // 计算需要额外延长的时间（秒）
        const additionalTimeNeeded = nftRemainingAfterExtend - walrusRemainingSeconds;
        console.log(`需要额外延长Walrus存储: ${additionalTimeNeeded}秒 (${(additionalTimeNeeded / (24 * 60 * 60)).toFixed(2)}天)`);

        // 计算需要额外延长的epochs
        const rawAdditionalEpochs = additionalTimeNeeded / epochDuration;
        epochsToAdd = Math.max(1, Math.ceil(rawAdditionalEpochs)); // 至少延长1个epoch

        console.log(`需要额外延长的epochs: ${rawAdditionalEpochs.toFixed(2)} -> ${epochsToAdd} (向上取整，最小为1)`);
        needExtend = true;
      } else {
        console.log(`Walrus存储剩余时间足够，无需延长`);
        needExtend = false;
      }

      // 计算目标结束epoch
      const targetEndEpoch = endEpoch + epochsToAdd;

      // 计算实际延长的时间（秒）
      const actualExtendDuration = epochsToAdd * epochDuration;

      console.log(`计算目标结束epoch: 当前结束epoch(${endEpoch}) + 延长epochs(${epochsToAdd}) = ${targetEndEpoch}`);
      console.log(`实际延长时间: ${actualExtendDuration}秒 (${(actualExtendDuration / (24 * 60 * 60)).toFixed(2)}天)`);
      console.log(`检查结果: 当前结束epoch=${endEpoch}, 目标结束epoch=${targetEndEpoch}, 需要延长=${needExtend}, 延长epochs=${epochsToAdd}`);

      return {
        needExtend,
        currentEndEpoch: endEpoch,
        targetEndEpoch,
        epochsToAdd
      };
    } catch (error) {
      console.error('检查是否需要延长存储期限时出错:', error);
      // 出错时默认需要延长，以确保安全
      return { needExtend: true, currentEndEpoch: 0, targetEndEpoch: 0, epochsToAdd: 1 };
    }
  }
}

// 创建单例实例
export const walrusService = new WalrusService();