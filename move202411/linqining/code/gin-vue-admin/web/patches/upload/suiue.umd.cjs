(function(global2, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("vue")) : typeof define === "function" && define.amd ? define(["exports", "vue"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory(global2.suiue = {}, global2.Vue));
})(this, function(exports2, vue) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

  var __classPrivateFieldSet = function(receiver, state, value2, kind, f) {
    if (kind === "m")
      throw new TypeError("Private method is not writable");
    if (kind === "a" && !f)
      throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
      throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value2) : f ? f.value = value2 : state.set(receiver, value2), value2;
  };
  var __classPrivateFieldGet = function(receiver, state, kind, f) {
    if (kind === "a" && !f)
      throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
      throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
  };
  var _AppReadyEvent_detail;
  let wallets = void 0;
  const registered = /* @__PURE__ */ new Set();
  const listeners = {};
  function getWallets() {
    if (wallets)
      return wallets;
    wallets = Object.freeze({ register, get, on: on$1 });
    if (typeof window === "undefined")
      return wallets;
    const api = Object.freeze({ register });
    try {
      window.addEventListener("wallet-standard:register-wallet", ({ detail: callback }) => callback(api));
    } catch (error2) {
      console.error("wallet-standard:register-wallet event listener could not be added\n", error2);
    }
    try {
      window.dispatchEvent(new AppReadyEvent(api));
    } catch (error2) {
      console.error("wallet-standard:app-ready event could not be dispatched\n", error2);
    }
    return wallets;
  }
  function register(...wallets2) {
    var _a;
    wallets2 = wallets2.filter((wallet) => !registered.has(wallet));
    if (!wallets2.length)
      return () => {
      };
    wallets2.forEach((wallet) => registered.add(wallet));
    (_a = listeners["register"]) == null ? void 0 : _a.forEach((listener) => guard(() => listener(...wallets2)));
    return function unregister() {
      var _a2;
      wallets2.forEach((wallet) => registered.delete(wallet));
      (_a2 = listeners["unregister"]) == null ? void 0 : _a2.forEach((listener) => guard(() => listener(...wallets2)));
    };
  }
  function get() {
    return [...registered];
  }
  function on$1(event, listener) {
    var _a;
    ((_a = listeners[event]) == null ? void 0 : _a.push(listener)) || (listeners[event] = [listener]);
    return function off2() {
      var _a2;
      listeners[event] = (_a2 = listeners[event]) == null ? void 0 : _a2.filter((existingListener) => listener !== existingListener);
    };
  }
  function guard(callback) {
    try {
      callback();
    } catch (error2) {
      console.error(error2);
    }
  }
  class AppReadyEvent extends Event {
    constructor(api) {
      super("wallet-standard:app-ready", {
        bubbles: false,
        cancelable: false,
        composed: false
      });
      _AppReadyEvent_detail.set(this, void 0);
      __classPrivateFieldSet(this, _AppReadyEvent_detail, api, "f");
    }
    get detail() {
      return __classPrivateFieldGet(this, _AppReadyEvent_detail, "f");
    }
    get type() {
      return "wallet-standard:app-ready";
    }
    /** @deprecated */
    preventDefault() {
      throw new Error("preventDefault cannot be called");
    }
    /** @deprecated */
    stopImmediatePropagation() {
      throw new Error("stopImmediatePropagation cannot be called");
    }
    /** @deprecated */
    stopPropagation() {
      throw new Error("stopPropagation cannot be called");
    }
  }
  _AppReadyEvent_detail = /* @__PURE__ */ new WeakMap();
  const browserWallets = vue.shallowRef([]);
  function registerWallet() {
    let walletsApi = getWallets();
    function appendWallet(wallet) {
      browserWallets.value.push(wallet);
      vue.triggerRef(browserWallets);
    }
    walletsApi.on("register", (wallet) => {
      appendWallet(wallet);
    });
    walletsApi.get().forEach((wallet) => appendWallet(wallet));
    walletsApi.on("unregister", (wallet) => {
      let index = browserWallets.value.indexOf(wallet);
      if (index >= 0) {
        browserWallets.value.splice(index, 1);
        vue.triggerRef(browserWallets);
      }
    });
  }
  function createSuiue() {
    return {
      install: (app) => {
        app.provide("PROVIDERS", []);
        registerWallet();
      }
    };
  }
  function getWalletIdentifier(wallet) {
    return wallet.id ? wallet.id : wallet.name;
  }
  function updateWalletConnectionInfo(info) {
    localStorage.setItem(`suiue:wallet-connection-info`, JSON.stringify(info));
  }
  function getWalletConnectionInfo() {
    let info = localStorage.getItem(`suiue:wallet-connection-info`);
    if (info) {
      return JSON.parse(info);
    }
    return null;
  }
  class SuiueError extends Error {
  }
  class FeatureNotSupportedError extends SuiueError {
    constructor() {
      super(...arguments);
      __publicField(this, "message", `suiue: feature not supported by wallet, did you forget to set requiredFeatures in SuiueProvider.vue ?`);
    }
  }
  class WalletNotConnectedError extends SuiueError {
    constructor() {
      super(...arguments);
      __publicField(this, "message", "suiue: wallet not connected, please connect wallet first.");
    }
  }
  class WalletAccountNotFoundError extends SuiueError {
    constructor() {
      super(...arguments);
      __publicField(this, "message", `suiue: wallet account not found, please connect wallet first.`);
    }
  }
  class ProviderNotExistsError extends SuiueError {
    constructor() {
      super(...arguments);
      __publicField(this, "message", "suiue: provider not exists, do you forget to wrap your component with <SuiueProvider> ?");
    }
  }
  class ProviderAlreadyExistsError extends SuiueError {
    constructor() {
      super(...arguments);
      __publicField(this, "message", `suiue: provider already exists, if you want use by multiply, please pass different id in config`);
    }
  }
  class InsufficientBalanceError extends SuiueError {
    constructor() {
      super(...arguments);
      __publicField(this, "message", `suiue: insufficient balance`);
    }
  }
  class RequestError extends SuiueError {
    constructor(message) {
      super(`suiue-request-error: ${message}`);
    }
  }
  class PluginNotInstallError extends SuiueError {
  }
  function useProvider(key) {
    let rst = vue.inject(key);
    if (!rst) {
      throw new ProviderNotExistsError();
    }
    return rst;
  }
  function setProvider(key, value2) {
    return vue.provide(key, value2);
  }
  class WalletState {
    constructor(config) {
      __publicField(this, "_cancelListen");
      __publicField(this, "_config");
      __publicField(this, "_wallet");
      __publicField(this, "_accounts");
      __publicField(this, "_onConnects");
      __publicField(this, "wallet");
      __publicField(this, "wallets");
      __publicField(this, "account");
      __publicField(this, "address");
      __publicField(this, "isConnected");
      this._config = config;
      this._wallet = vue.shallowRef();
      this.wallet = vue.computed(() => this._wallet.value);
      this._accounts = vue.shallowRef([]);
      this._onConnects = [];
      this._cancelListen = void 0;
      this.account = vue.computed(() => this._accounts.value[0]);
      this.isConnected = vue.computed(() => !!this._wallet.value);
      this.address = vue.computed(() => {
        var _a;
        return (_a = this.account.value) == null ? void 0 : _a.address;
      });
      this.wallets = vue.computed(() => {
        let wallets2 = browserWallets == null ? void 0 : browserWallets.value.filter(
          (wallet) => {
            var _a;
            return (_a = this._config.requiredFeatures) == null ? void 0 : _a.every(
              (feature) => feature in wallet.features
            );
          }
        );
        wallets2 = wallets2.filter((wallet) => wallet.chains.includes(`sui:${this._config.network}`));
        if (!wallets2) {
          return [];
        }
        return [
          // Preferred wallets, in order:
          ...this._config.preferredWallets.map((name) => wallets2.find((wallet) => getWalletIdentifier(wallet).toLowerCase() === name)).filter(Boolean),
          // Wallets in default order:
          ...wallets2.filter((wallet) => !this._config.preferredWallets.includes(getWalletIdentifier(wallet).toLowerCase()))
        ];
      });
    }
    updateAccounts(target, accounts) {
      if (!this._wallet.value) {
        return;
      }
      if (getWalletIdentifier(target) === getWalletIdentifier(this._wallet.value)) {
        this._accounts.value = accounts;
      }
    }
    async handlerConnect() {
      await Promise.all(
        this._onConnects.map((cb) => new Promise(() => cb(this)))
      );
    }
    async connect(target, preferredAddress) {
      var _a;
      if (this.isConnected) {
        await this.disconnect();
      }
      let output = await target.features["standard:connect"].connect();
      if (output.accounts.length === 0) {
        throw new WalletAccountNotFoundError("connect failed: no account provide by wallet.");
      }
      let accounts = [
        ...output.accounts.filter((account) => account.address === preferredAddress),
        ...output.accounts.filter((account) => account.address !== preferredAddress)
      ];
      this._wallet.value = target;
      this.updateAccounts(target, accounts);
      updateWalletConnectionInfo({
        wallet_ident: getWalletIdentifier(target),
        account_addr: this.address.value
      });
      this._cancelListen = (_a = target.features["standard:events"]) == null ? void 0 : _a.on("change", async (event) => {
        var _a2, _b;
        if (this.wallet.value && getWalletIdentifier(this.wallet.value) !== getWalletIdentifier(this.wallet.value)) {
          return;
        }
        if (JSON.stringify((_a2 = event.accounts) == null ? void 0 : _a2.map((account) => account.address)) !== JSON.stringify(this._accounts.value.map((account) => account.address))) {
          if (((_b = event.accounts) == null ? void 0 : _b.length) === 0) {
            await this.disconnect();
          } else {
            this.updateAccounts(target, event.accounts);
          }
        }
      });
      this.handlerConnect();
    }
    async disconnect() {
      var _a;
      if (!this._wallet.value) {
        return;
      }
      try {
        await ((_a = this._wallet.value.features["standard:disconnect"]) == null ? void 0 : _a.disconnect());
      } catch {
      }
      this._wallet.value = void 0;
      this._accounts.value = [];
      updateWalletConnectionInfo({
        wallet_ident: null,
        account_addr: null
      });
      if (this._cancelListen) {
        this._cancelListen();
        this._cancelListen = void 0;
      }
    }
    checkConnected() {
      if (!this.wallet.value) {
        throw new WalletNotConnectedError();
      }
    }
    /** set a call bcak when connect, call again to cancel
     * @example
     * ```
     * let cancel = wallet.onConnect((state) => {
     *    useWalletQuery().objects.loadAll()
     * })
     *
     * // cancel the callback
     * cancel()
     */
    onConnect(cb) {
      const cancel = () => {
        this._onConnects.splice(this._onConnects.indexOf(cb), 1);
      };
      this._onConnects.push(cb);
      return () => cancel.call(this);
    }
  }
  const useWalletState = () => useProvider("WALLET_STATE");
  const consts = {
    COIN_SUI: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
    COIN_USDC: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    COIN_USDT: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    COIN_CETUS: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
    COIN_NAVX: "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",
    MIST_PER_SUI: 1e9,
    SUI_FRAMEWORK: "0x0000000000000000000000000000000000000000000000000000000000000002",
    SUI_SYSTEM: "0x0000000000000000000000000000000000000000000000000000000000000003",
    SUI_CLOCK: "0x0000000000000000000000000000000000000000000000000000000000000006",
    SUI_RANDOM: "0x0000000000000000000000000000000000000000000000000000000000000008"
  };
  class WalletActions {
    constructor(config, query, state) {
      __publicField(this, "state");
      __publicField(this, "config");
      __publicField(this, "query");
      __publicField(this, "features");
      this.config = config;
      this.state = state;
      this.query = query;
      this.features = config.requiredFeatures;
    }
    checkFeat(feat) {
      if (!this.features.includes(feat)) {
        throw new FeatureNotSupportedError();
      }
    }
    // a decorator, check feat and connected
    check(feat) {
      this.checkFeat(feat);
      this.state.checkConnected();
    }
    async signAndExecuteTransactionBlock(txb, options, requestType) {
      this.check("sui:signAndExecuteTransactionBlock");
      return await this.state.wallet.value.features["sui:signAndExecuteTransactionBlock"].signAndExecuteTransactionBlock({
        transactionBlock: txb,
        chain: `sui:${this.config.network}`,
        account: this.state.account.value,
        options,
        requestType
      });
    }
    async signTransactionBlock(txb) {
      this.check("sui:signTransactionBlock");
      return await this.state.wallet.value.features["sui:signTransactionBlock"].signTransactionBlock({
        transactionBlock: txb,
        account: this.state.account.value,
        chain: `sui:${this.config.network}`
      });
    }
    async signPersonalMessage(message) {
      this.check("sui:signPersonalMessage");
      if (typeof message === "string") {
        message = new TextEncoder().encode(message);
      }
      return await this.state.wallet.value.features["sui:signPersonalMessage"].signPersonalMessage({
        message,
        account: this.state.account.value
      });
    }
    async signMessage(message) {
      this.check("sui:signMessage");
      if (typeof message === "string") {
        message = new TextEncoder().encode(message);
      }
      return await this.state.wallet.value.features["sui:signMessage"].signMessage({
        message,
        account: this.state.account.value
      });
    }
    async getExactlyCoinAmount(options) {
      let { txb, coinType, amt } = options;
      let isSUI = coinType === consts.COIN_SUI || coinType === "0x2::sui::SUI";
      if (typeof amt === "string" || typeof amt === "number") {
        amt = BigInt(amt);
      }
      const balance = this.query.balances[coinType] ?? await this.query.loadBalance(coinType);
      if (BigInt(balance.totalBalance) < amt) {
        throw new InsufficientBalanceError();
      }
      const coins = this.query.coins.value[coinType] ?? await this.query.loadCoins(coinType);
      if (coins.length === 0) {
        throw new Error("unexpected error: no coin found for the specified coin type");
      }
      if (isSUI) {
        return txb.splitCoins(txb.gas, [amt]);
      }
      let [primaryCoin, ...mergedCoin] = coins.map((coin) => txb.object(coin.id));
      if (mergedCoin.length) {
        txb.mergeCoins(primaryCoin, mergedCoin);
      }
      return txb.splitCoins(primaryCoin, [amt]);
    }
  }
  const useWalletActions = () => useProvider("WALLET_ACTIONS");
  function defaultBalanceStruct(type2) {
    return {
      type: type2,
      totalBalance: "0",
      coinObjectCount: 0
    };
  }
  function mapDisplayArrayToObject(display) {
    if (!display) {
      return null;
    }
    return display.reduce((acc, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});
  }
  var e = {
    NAME: "Name",
    DOCUMENT: "Document",
    OPERATION_DEFINITION: "OperationDefinition",
    VARIABLE_DEFINITION: "VariableDefinition",
    SELECTION_SET: "SelectionSet",
    FIELD: "Field",
    ARGUMENT: "Argument",
    FRAGMENT_SPREAD: "FragmentSpread",
    INLINE_FRAGMENT: "InlineFragment",
    FRAGMENT_DEFINITION: "FragmentDefinition",
    VARIABLE: "Variable",
    INT: "IntValue",
    FLOAT: "FloatValue",
    STRING: "StringValue",
    BOOLEAN: "BooleanValue",
    NULL: "NullValue",
    ENUM: "EnumValue",
    LIST: "ListValue",
    OBJECT: "ObjectValue",
    OBJECT_FIELD: "ObjectField",
    DIRECTIVE: "Directive",
    NAMED_TYPE: "NamedType",
    LIST_TYPE: "ListType",
    NON_NULL_TYPE: "NonNullType"
  };
  class GraphQLError extends Error {
    constructor(e2, r, i2, n2, a2, t2, l2) {
      super(e2);
      this.name = "GraphQLError";
      this.message = e2;
      if (a2) {
        this.path = a2;
      }
      if (r) {
        this.nodes = Array.isArray(r) ? r : [r];
      }
      if (i2) {
        this.source = i2;
      }
      if (n2) {
        this.positions = n2;
      }
      if (t2) {
        this.originalError = t2;
      }
      var o2 = l2;
      if (!o2 && t2) {
        var u2 = t2.extensions;
        if (u2 && "object" == typeof u2) {
          o2 = u2;
        }
      }
      this.extensions = o2 || {};
    }
    toJSON() {
      return {
        ...this,
        message: this.message
      };
    }
    toString() {
      return this.message;
    }
    get [Symbol.toStringTag]() {
      return "GraphQLError";
    }
  }
  var i;
  var n;
  function error(e2) {
    return new GraphQLError(`Syntax Error: Unexpected token at ${n} in ${e2}`);
  }
  function advance(e2) {
    e2.lastIndex = n;
    if (e2.test(i)) {
      return i.slice(n, n = e2.lastIndex);
    }
  }
  var a = / +(?=[^\s])/y;
  function blockString(e2) {
    var r = e2.split("\n");
    var i2 = "";
    var n2 = 0;
    var t2 = 0;
    var l2 = r.length - 1;
    for (var o2 = 0; o2 < r.length; o2++) {
      a.lastIndex = 0;
      if (a.test(r[o2])) {
        if (o2 && (!n2 || a.lastIndex < n2)) {
          n2 = a.lastIndex;
        }
        t2 = t2 || o2;
        l2 = o2;
      }
    }
    for (var u2 = t2; u2 <= l2; u2++) {
      if (u2 !== t2) {
        i2 += "\n";
      }
      i2 += r[u2].slice(n2).replace(/\\"""/g, '"""');
    }
    return i2;
  }
  function ignored() {
    for (var e2 = 0 | i.charCodeAt(n++); 9 === e2 || 10 === e2 || 13 === e2 || 32 === e2 || 35 === e2 || 44 === e2 || 65279 === e2; e2 = 0 | i.charCodeAt(n++)) {
      if (35 === e2) {
        while (10 !== (e2 = i.charCodeAt(n++)) && 13 !== e2) {
        }
      }
    }
    n--;
  }
  var t = /[_A-Za-z]\w*/y;
  var l = new RegExp("(?:(null|true|false)|\\$(" + t.source + ')|(-?\\d+)((?:\\.\\d+)?[eE][+-]?\\d+|\\.\\d+)?|("""(?:"""|(?:[\\s\\S]*?[^\\\\])"""))|("(?:"|[^\\r\\n]*?[^\\\\]"))|(' + t.source + "))", "y");
  var o = function(e2) {
    e2[e2.Const = 1] = "Const";
    e2[e2.Var = 2] = "Var";
    e2[e2.Int = 3] = "Int";
    e2[e2.Float = 4] = "Float";
    e2[e2.BlockString = 5] = "BlockString";
    e2[e2.String = 6] = "String";
    e2[e2.Enum = 7] = "Enum";
    return e2;
  }(o || {});
  var u = /\\/g;
  function value(e2) {
    var r;
    var a2;
    l.lastIndex = n;
    if (91 === i.charCodeAt(n)) {
      n++;
      ignored();
      var d2 = [];
      while (93 !== i.charCodeAt(n)) {
        d2.push(value(e2));
      }
      n++;
      ignored();
      return {
        kind: "ListValue",
        values: d2
      };
    } else if (123 === i.charCodeAt(n)) {
      n++;
      ignored();
      var v2 = [];
      while (125 !== i.charCodeAt(n)) {
        if (null == (r = advance(t))) {
          throw error("ObjectField");
        }
        ignored();
        if (58 !== i.charCodeAt(n++)) {
          throw error("ObjectField");
        }
        ignored();
        v2.push({
          kind: "ObjectField",
          name: {
            kind: "Name",
            value: r
          },
          value: value(e2)
        });
      }
      n++;
      ignored();
      return {
        kind: "ObjectValue",
        fields: v2
      };
    } else if (null != (a2 = l.exec(i))) {
      n = l.lastIndex;
      ignored();
      if (null != (r = a2[o.Const])) {
        return "null" === r ? {
          kind: "NullValue"
        } : {
          kind: "BooleanValue",
          value: "true" === r
        };
      } else if (null != (r = a2[o.Var])) {
        if (e2) {
          throw error("Variable");
        } else {
          return {
            kind: "Variable",
            name: {
              kind: "Name",
              value: r
            }
          };
        }
      } else if (null != (r = a2[o.Int])) {
        var s2;
        if (null != (s2 = a2[o.Float])) {
          return {
            kind: "FloatValue",
            value: r + s2
          };
        } else {
          return {
            kind: "IntValue",
            value: r
          };
        }
      } else if (null != (r = a2[o.BlockString])) {
        return {
          kind: "StringValue",
          value: blockString(r.slice(3, -3)),
          block: true
        };
      } else if (null != (r = a2[o.String])) {
        return {
          kind: "StringValue",
          value: u.test(r) ? JSON.parse(r) : r.slice(1, -1),
          block: false
        };
      } else if (null != (r = a2[o.Enum])) {
        return {
          kind: "EnumValue",
          value: r
        };
      }
    }
    throw error("Value");
  }
  function arguments_(e2) {
    if (40 === i.charCodeAt(n)) {
      var r = [];
      n++;
      ignored();
      var a2;
      do {
        if (null == (a2 = advance(t))) {
          throw error("Argument");
        }
        ignored();
        if (58 !== i.charCodeAt(n++)) {
          throw error("Argument");
        }
        ignored();
        r.push({
          kind: "Argument",
          name: {
            kind: "Name",
            value: a2
          },
          value: value(e2)
        });
      } while (41 !== i.charCodeAt(n));
      n++;
      ignored();
      return r;
    }
  }
  function directives(e2) {
    if (64 === i.charCodeAt(n)) {
      var r = [];
      var a2;
      do {
        n++;
        if (null == (a2 = advance(t))) {
          throw error("Directive");
        }
        ignored();
        r.push({
          kind: "Directive",
          name: {
            kind: "Name",
            value: a2
          },
          arguments: arguments_(e2)
        });
      } while (64 === i.charCodeAt(n));
      return r;
    }
  }
  function type() {
    var e2;
    var r = 0;
    while (91 === i.charCodeAt(n)) {
      r++;
      n++;
      ignored();
    }
    if (null == (e2 = advance(t))) {
      throw error("NamedType");
    }
    ignored();
    var a2 = {
      kind: "NamedType",
      name: {
        kind: "Name",
        value: e2
      }
    };
    do {
      if (33 === i.charCodeAt(n)) {
        n++;
        ignored();
        a2 = {
          kind: "NonNullType",
          type: a2
        };
      }
      if (r) {
        if (93 !== i.charCodeAt(n++)) {
          throw error("NamedType");
        }
        ignored();
        a2 = {
          kind: "ListType",
          type: a2
        };
      }
    } while (r--);
    return a2;
  }
  var d = new RegExp("(?:(\\.{3})|(" + t.source + "))", "y");
  var v = function(e2) {
    e2[e2.Spread = 1] = "Spread";
    e2[e2.Name = 2] = "Name";
    return e2;
  }(v || {});
  function selectionSet() {
    var e2 = [];
    var r;
    var a2;
    do {
      d.lastIndex = n;
      if (null != (a2 = d.exec(i))) {
        n = d.lastIndex;
        if (null != a2[v.Spread]) {
          ignored();
          var l2 = advance(t);
          if (null != l2 && "on" !== l2) {
            ignored();
            e2.push({
              kind: "FragmentSpread",
              name: {
                kind: "Name",
                value: l2
              },
              directives: directives(false)
            });
          } else {
            ignored();
            if ("on" === l2) {
              if (null == (l2 = advance(t))) {
                throw error("NamedType");
              }
              ignored();
            }
            var o2 = directives(false);
            if (123 !== i.charCodeAt(n++)) {
              throw error("InlineFragment");
            }
            ignored();
            e2.push({
              kind: "InlineFragment",
              typeCondition: l2 ? {
                kind: "NamedType",
                name: {
                  kind: "Name",
                  value: l2
                }
              } : void 0,
              directives: o2,
              selectionSet: selectionSet()
            });
          }
        } else if (null != (r = a2[v.Name])) {
          var u2 = void 0;
          ignored();
          if (58 === i.charCodeAt(n)) {
            n++;
            ignored();
            u2 = r;
            if (null == (r = advance(t))) {
              throw error("Field");
            }
            ignored();
          }
          var s2 = arguments_(false);
          ignored();
          var c2 = directives(false);
          var f = void 0;
          if (123 === i.charCodeAt(n)) {
            n++;
            ignored();
            f = selectionSet();
          }
          e2.push({
            kind: "Field",
            alias: u2 ? {
              kind: "Name",
              value: u2
            } : void 0,
            name: {
              kind: "Name",
              value: r
            },
            arguments: s2,
            directives: c2,
            selectionSet: f
          });
        }
      } else {
        throw error("SelectionSet");
      }
    } while (125 !== i.charCodeAt(n));
    n++;
    ignored();
    return {
      kind: "SelectionSet",
      selections: e2
    };
  }
  function fragmentDefinition() {
    var e2;
    var r;
    if (null == (e2 = advance(t))) {
      throw error("FragmentDefinition");
    }
    ignored();
    if ("on" !== advance(t)) {
      throw error("FragmentDefinition");
    }
    ignored();
    if (null == (r = advance(t))) {
      throw error("FragmentDefinition");
    }
    ignored();
    var a2 = directives(false);
    if (123 !== i.charCodeAt(n++)) {
      throw error("FragmentDefinition");
    }
    ignored();
    return {
      kind: "FragmentDefinition",
      name: {
        kind: "Name",
        value: e2
      },
      typeCondition: {
        kind: "NamedType",
        name: {
          kind: "Name",
          value: r
        }
      },
      directives: a2,
      selectionSet: selectionSet()
    };
  }
  var s = /(?:query|mutation|subscription|fragment)/y;
  function operationDefinition(e2) {
    var r;
    var a2;
    var l2;
    if (e2) {
      ignored();
      r = advance(t);
      a2 = function variableDefinitions() {
        ignored();
        if (40 === i.charCodeAt(n)) {
          var e3 = [];
          n++;
          ignored();
          var r2;
          do {
            if (36 !== i.charCodeAt(n++)) {
              throw error("Variable");
            }
            if (null == (r2 = advance(t))) {
              throw error("Variable");
            }
            ignored();
            if (58 !== i.charCodeAt(n++)) {
              throw error("VariableDefinition");
            }
            ignored();
            var a3 = type();
            var l3 = void 0;
            if (61 === i.charCodeAt(n)) {
              n++;
              ignored();
              l3 = value(true);
            }
            ignored();
            e3.push({
              kind: "VariableDefinition",
              variable: {
                kind: "Variable",
                name: {
                  kind: "Name",
                  value: r2
                }
              },
              type: a3,
              defaultValue: l3,
              directives: directives(true)
            });
          } while (41 !== i.charCodeAt(n));
          n++;
          ignored();
          return e3;
        }
      }();
      l2 = directives(false);
    }
    if (123 === i.charCodeAt(n)) {
      n++;
      ignored();
      return {
        kind: "OperationDefinition",
        operation: e2 || "query",
        name: r ? {
          kind: "Name",
          value: r
        } : void 0,
        variableDefinitions: a2,
        directives: l2,
        selectionSet: selectionSet()
      };
    }
  }
  function parse(e2, r) {
    i = "string" == typeof e2.body ? e2.body : e2;
    n = 0;
    return function document2() {
      var e3;
      var r2;
      ignored();
      var a2 = [];
      do {
        if ("fragment" === (e3 = advance(s))) {
          ignored();
          a2.push(fragmentDefinition());
        } else if (null != (r2 = operationDefinition(e3))) {
          a2.push(r2);
        } else {
          throw error("Document");
        }
      } while (n < i.length);
      return {
        kind: "Document",
        definitions: a2
      };
    }();
  }
  function initGraphQLTada() {
    function graphql2(e$1, i2) {
      var a2 = parse(e$1).definitions;
      var t2 = /* @__PURE__ */ new Set();
      for (var s2 of i2 || []) {
        for (var d2 of s2.definitions) {
          if (d2.kind === e.FRAGMENT_DEFINITION && !t2.has(d2)) {
            a2.push(d2);
            t2.add(d2);
          }
        }
      }
      if (a2[0].kind === e.FRAGMENT_DEFINITION && a2[0].directives) {
        a2[0].directives = a2[0].directives.filter((n2) => "_unmask" !== n2.name.value);
      }
      return {
        kind: e.DOCUMENT,
        definitions: a2
      };
    }
    graphql2.scalar = function scalar(n2, r) {
      return r;
    };
    graphql2.persisted = function persisted(r, e$1) {
      return {
        kind: e.DOCUMENT,
        definitions: e$1 ? e$1.definitions : [],
        documentId: r
      };
    };
    return graphql2;
  }
  function readFragment(...n2) {
    return 2 === n2.length ? n2[1] : n2[0];
  }
  initGraphQLTada();
  const graphql = initGraphQLTada();
  const pageInfoFragment = graphql(`
    fragment PageInfoFragment on PageInfo {
        hasNextPage,
        endCursor
    }
`);
  const balanceFragment = graphql(`
    fragment BalanceFragment on Balance {
        coinType {
            repr
        }
        coinObjectCount
        totalBalance
    }
`);
  const objectFragment = graphql(`
    fragment ObjectFragment on MoveObject {
        digest
        address
        version
        display {
            key
            value
        }
        contents {
            type {
                repr
            }
            json
        }
    }

`);
  const QueryDocuments = {
    balance: graphql(`
        query Balance($queryAddress: SuiAddress!, $type: String!){
            address(address: $queryAddress){
                balance(type: $type){
                    ...BalanceFragment
                }
            }
        }
    `, [balanceFragment]),
    balances: graphql(`
        query Balances($queryAddress: SuiAddress!, $cursor: String){
            address(address: $queryAddress){
                balances(first: 10, after: $cursor){
                    pageInfo {
                        ...PageInfoFragment
                    }
                    nodes {
                        ...BalanceFragment
                    }
                }
            }
        }
    `, [balanceFragment, pageInfoFragment]),
    object: graphql(`
        query Object($queryAddress: SuiAddress!, $type: String, $cursor: String){
            address(address: $queryAddress){
                objects(first: 10, filter: {type: $type}, after: $cursor){
                    pageInfo {
                        ...PageInfoFragment
                    }
                    nodes {
                        ...ObjectFragment
                    }
                }
            }
        }
    `, [pageInfoFragment, objectFragment])
  };
  const queryBalance = QueryDocuments.balance;
  const queryBalances = QueryDocuments.balances;
  const queryObject = QueryDocuments.object;
  function readPageInfo(data) {
    return readFragment(pageInfoFragment, data);
  }
  function readBalance(data) {
    return readFragment(balanceFragment, data);
  }
  function readObject(data) {
    return readFragment(objectFragment, data);
  }
  function getNextCursor(data) {
    const pageInfo = readPageInfo(data);
    return (pageInfo == null ? void 0 : pageInfo.hasNextPage) ? pageInfo == null ? void 0 : pageInfo.endCursor : void 0;
  }
  class WalletQuery {
    constructor(config, state) {
      // TODO: subscribe to account changes
      __publicField(this, "_state");
      __publicField(this, "_config");
      // undefined if not resolved, null if not exist
      __publicField(this, "_domain");
      __publicField(this, "balances");
      __publicField(this, "objects");
      __publicField(this, "client");
      __publicField(this, "clientQL");
      __publicField(this, "coins");
      __publicField(this, "suiBalance");
      __publicField(this, "suiCoins");
      this.client = config.suiClient;
      this.clientQL = config.suiClientQL;
      this._config = config;
      this._state = state;
      this._domain = vue.ref(void 0);
      this.balances = vue.reactive({});
      this.objects = vue.reactive({});
      this.suiBalance = vue.computed(
        () => {
          var _a;
          return (_a = this.balances["0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"]) == null ? void 0 : _a.totalBalance;
        }
      );
      this.suiCoins = vue.computed(
        () => this.coins.value["0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"]
      );
      this.coins = vue.computed(() => {
        return Object.keys(this.objects).filter((key) => key.indexOf("2::coin::Coin<")).reduce((result, key) => {
          let coinType = key.substring(key.indexOf("<") + 1, key.indexOf(">"));
          result[coinType] = this.objects[key];
          return result;
        }, {});
      });
      vue.watch(this._state.isConnected, (value2) => {
        if (value2) {
          this.loadBalance("0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI");
          this.loadCoins("0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI");
        } else {
          this.reset();
        }
      });
    }
    reset() {
      function emptyObj(obj) {
        for (let key in obj) {
          delete obj[key];
        }
      }
      this._domain.value = void 0;
      emptyObj(this.balances);
      emptyObj(this.objects);
    }
    get domain() {
      if (this._domain.value === void 0) {
        const cancel = vue.watch(this._state.isConnected, (value2) => {
          if (value2) {
            this.client.resolveNameServiceNames({
              address: this._state.address.value
            }).then(({ data }) => {
              if (data && data[0]) {
                this._domain.value = data[0];
              } else {
                this._domain.value = null;
              }
            });
            cancel();
          }
        });
      }
      return vue.readonly(this._domain);
    }
    async query(document2, variables) {
      let { queryRetry, queryRetryIntervalMs } = this._config;
      async function fail() {
        queryRetry--;
        await new Promise((resolve) => setTimeout(resolve, queryRetryIntervalMs));
      }
      while (queryRetry > 0) {
        try {
          const rsp = await this.clientQL.query({
            query: document2,
            variables
          });
          if (rsp.errors) {
            await fail();
          }
          return rsp.data;
        } catch (e2) {
          await fail();
          console.warn("suiue: query error", e2);
        }
      }
      throw new RequestError(`suiue: query failed of: ${document2}`);
    }
    async queryAll(document2, variables, getNextCursor2, dataHandler) {
      let cursor = void 0;
      do {
        const data = await this.query(document2, {
          ...variables,
          cursor
        });
        cursor = getNextCursor2(data);
        dataHandler(data);
      } while (cursor);
    }
    async loadBalance(coinType) {
      var _a, _b;
      const queryAddress = this._state.address.value;
      if (!queryAddress) {
        throw new WalletNotConnectedError();
      }
      const _default = defaultBalanceStruct(coinType);
      this.balances[coinType] = _default;
      const rsp = await this.query(
        queryBalance,
        {
          queryAddress,
          type: coinType
        }
      );
      if (!((_a = rsp.address) == null ? void 0 : _a.balance)) {
        return _default;
      }
      let rawBalance = readBalance((_b = rsp.address) == null ? void 0 : _b.balance);
      if (rawBalance) {
        this.balances[coinType] = {
          type: rawBalance.coinType.repr,
          coinObjectCount: rawBalance.coinObjectCount,
          totalBalance: rawBalance.totalBalance
        };
      }
      return this.balances[coinType];
    }
    async loadAllBalance() {
      const queryAddress = this._state.address.value;
      if (!queryAddress) {
        throw new WalletNotConnectedError();
      }
      await this.queryAll(
        queryBalances,
        {
          queryAddress
        },
        (data) => {
          var _a;
          return getNextCursor((_a = data.address) == null ? void 0 : _a.balances.pageInfo);
        },
        (data) => {
          var _a, _b;
          (_b = (_a = data.address) == null ? void 0 : _a.balances.nodes) == null ? void 0 : _b.forEach((node) => {
            let rawBalance = readBalance(node);
            if (!rawBalance) {
              return;
            }
            let type2 = rawBalance.coinType.repr;
            this.balances[type2] = {
              type: type2,
              totalBalance: rawBalance.totalBalance,
              coinObjectCount: rawBalance.coinObjectCount
            };
          });
        }
      );
      return this.balances;
    }
    async loadObjects(type2) {
      const queryAddress = this._state.address.value;
      if (!queryAddress) {
        throw new WalletNotConnectedError();
      }
      await this.queryAll(
        queryObject,
        {
          queryAddress,
          type: type2 === "$all" ? void 0 : type2
        },
        (data) => {
          var _a;
          return getNextCursor((_a = data.address) == null ? void 0 : _a.objects.pageInfo);
        },
        (data) => {
          var _a, _b;
          (_b = (_a = data.address) == null ? void 0 : _a.objects.nodes) == null ? void 0 : _b.forEach((node) => {
            var _a2, _b2;
            let rawObj = readObject(node);
            if (!rawObj) {
              return;
            }
            let objType = rawObj.contents.type.repr;
            let obj = {
              type: objType,
              id: rawObj.address,
              digest: rawObj.digest,
              version: rawObj.version,
              contents: (_a2 = rawObj.contents) == null ? void 0 : _a2.json,
              display: mapDisplayArrayToObject(rawObj.display)
            };
            if (objType in this.objects) {
              if (((_b2 = this.objects[objType]) == null ? void 0 : _b2.filter((o2) => o2.id === obj.id).length) === 0) {
                this.objects[objType].push(obj);
              } else {
                this.objects[objType] = this.objects[objType].map((o2) => {
                  if (o2.id === obj.id) {
                    return obj;
                  }
                  return o2;
                });
              }
            } else {
              this.objects[objType] = [obj];
            }
          });
        }
      );
      if (type2 === "$all") {
        return this.objects;
      } else {
        return {
          [type2]: this.objects[type2]
        };
      }
    }
    async loadAllObjects() {
      return await this.loadObjects("$all");
    }
    async loadCoins(coinType) {
      return await this.loadObjects(
        `0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${coinType}>`
      );
    }
    async loadAllCoins() {
      return await this.loadObjects(
        "0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin"
      );
    }
  }
  const useWalletQuery = () => useProvider("WALLET_QUERY");
  const PACKAGE_VERSION = "0.51.2";
  const TARGETED_RPC_VERSION = "1.23.0";
  const CODE_TO_ERROR_TYPE = {
    "-32700": "ParseError",
    "-32600": "InvalidRequest",
    "-32601": "MethodNotFound",
    "-32602": "InvalidParams",
    "-32603": "InternalError"
  };
  class SuiHTTPTransportError extends Error {
  }
  class JsonRpcError extends SuiHTTPTransportError {
    constructor(message, code) {
      super(message);
      this.code = code;
      this.type = CODE_TO_ERROR_TYPE[code] ?? "ServerError";
    }
  }
  class SuiHTTPStatusError extends SuiHTTPTransportError {
    constructor(message, status, statusText) {
      super(message);
      this.status = status;
      this.statusText = statusText;
    }
  }
  var __accessCheck$2 = (obj, member, msg2) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg2);
  };
  var __privateGet$2 = (obj, member, getter) => {
    __accessCheck$2(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
  };
  var __privateAdd$2 = (obj, member, value2) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value2);
  };
  var __privateSet$2 = (obj, member, value2, setter) => {
    __accessCheck$2(obj, member, "write to private field");
    setter ? setter.call(obj, value2) : member.set(obj, value2);
    return value2;
  };
  var __privateWrapper = (obj, member, setter, getter) => ({
    set _(value2) {
      __privateSet$2(obj, member, value2, setter);
    },
    get _() {
      return __privateGet$2(obj, member, getter);
    }
  });
  var __privateMethod$1 = (obj, member, method) => {
    __accessCheck$2(obj, member, "access private method");
    return method;
  };
  var _requestId$1, _disconnects, _webSocket, _connectionPromise, _subscriptions, _pendingRequests, _setupWebSocket, setupWebSocket_fn, _reconnect, reconnect_fn;
  function getWebsocketUrl(httpUrl) {
    const url = new URL(httpUrl);
    url.protocol = url.protocol.replace("http", "ws");
    return url.toString();
  }
  const DEFAULT_CLIENT_OPTIONS = {
    // We fudge the typing because we also check for undefined in the constructor:
    WebSocketConstructor: typeof WebSocket !== "undefined" ? WebSocket : void 0,
    callTimeout: 3e4,
    reconnectTimeout: 3e3,
    maxReconnects: 5
  };
  class WebsocketClient {
    constructor(endpoint, options = {}) {
      __privateAdd$2(this, _setupWebSocket);
      __privateAdd$2(this, _reconnect);
      __privateAdd$2(this, _requestId$1, 0);
      __privateAdd$2(this, _disconnects, 0);
      __privateAdd$2(this, _webSocket, null);
      __privateAdd$2(this, _connectionPromise, null);
      __privateAdd$2(this, _subscriptions, /* @__PURE__ */ new Set());
      __privateAdd$2(this, _pendingRequests, /* @__PURE__ */ new Map());
      this.endpoint = endpoint;
      this.options = { ...DEFAULT_CLIENT_OPTIONS, ...options };
      if (!this.options.WebSocketConstructor) {
        throw new Error("Missing WebSocket constructor");
      }
      if (this.endpoint.startsWith("http")) {
        this.endpoint = getWebsocketUrl(this.endpoint);
      }
    }
    async makeRequest(method, params) {
      const webSocket = await __privateMethod$1(this, _setupWebSocket, setupWebSocket_fn).call(this);
      return new Promise((resolve, reject) => {
        __privateSet$2(this, _requestId$1, __privateGet$2(this, _requestId$1) + 1);
        __privateGet$2(this, _pendingRequests).set(__privateGet$2(this, _requestId$1), {
          resolve,
          reject,
          timeout: setTimeout(() => {
            __privateGet$2(this, _pendingRequests).delete(__privateGet$2(this, _requestId$1));
            reject(new Error(`Request timeout: ${method}`));
          }, this.options.callTimeout)
        });
        webSocket.send(JSON.stringify({ jsonrpc: "2.0", id: __privateGet$2(this, _requestId$1), method, params }));
      }).then(({ error: error2, result }) => {
        if (error2) {
          throw new JsonRpcError(error2.message, error2.code);
        }
        return result;
      });
    }
    async subscribe(input) {
      const subscription = new RpcSubscription(input);
      __privateGet$2(this, _subscriptions).add(subscription);
      await subscription.subscribe(this);
      return () => subscription.unsubscribe(this);
    }
  }
  _requestId$1 = /* @__PURE__ */ new WeakMap();
  _disconnects = /* @__PURE__ */ new WeakMap();
  _webSocket = /* @__PURE__ */ new WeakMap();
  _connectionPromise = /* @__PURE__ */ new WeakMap();
  _subscriptions = /* @__PURE__ */ new WeakMap();
  _pendingRequests = /* @__PURE__ */ new WeakMap();
  _setupWebSocket = /* @__PURE__ */ new WeakSet();
  setupWebSocket_fn = function() {
    if (__privateGet$2(this, _connectionPromise)) {
      return __privateGet$2(this, _connectionPromise);
    }
    __privateSet$2(this, _connectionPromise, new Promise((resolve) => {
      var _a;
      (_a = __privateGet$2(this, _webSocket)) == null ? void 0 : _a.close();
      __privateSet$2(this, _webSocket, new this.options.WebSocketConstructor(this.endpoint));
      __privateGet$2(this, _webSocket).addEventListener("open", () => {
        __privateSet$2(this, _disconnects, 0);
        resolve(__privateGet$2(this, _webSocket));
      });
      __privateGet$2(this, _webSocket).addEventListener("close", () => {
        __privateWrapper(this, _disconnects)._++;
        if (__privateGet$2(this, _disconnects) <= this.options.maxReconnects) {
          setTimeout(() => {
            __privateMethod$1(this, _reconnect, reconnect_fn).call(this);
          }, this.options.reconnectTimeout);
        }
      });
      __privateGet$2(this, _webSocket).addEventListener("message", ({ data }) => {
        let json;
        try {
          json = JSON.parse(data);
        } catch (error2) {
          console.error(new Error(`Failed to parse RPC message: ${data}`, { cause: error2 }));
          return;
        }
        if ("id" in json && json.id != null && __privateGet$2(this, _pendingRequests).has(json.id)) {
          const { resolve: resolve2, timeout } = __privateGet$2(this, _pendingRequests).get(json.id);
          clearTimeout(timeout);
          resolve2(json);
        } else if ("params" in json) {
          const { params } = json;
          __privateGet$2(this, _subscriptions).forEach((subscription) => {
            if (subscription.subscriptionId === params.subscription) {
              if (params.subscription === subscription.subscriptionId) {
                subscription.onMessage(params.result);
              }
            }
          });
        }
      });
    }));
    return __privateGet$2(this, _connectionPromise);
  };
  _reconnect = /* @__PURE__ */ new WeakSet();
  reconnect_fn = async function() {
    var _a;
    (_a = __privateGet$2(this, _webSocket)) == null ? void 0 : _a.close();
    __privateSet$2(this, _connectionPromise, null);
    return Promise.allSettled(
      [...__privateGet$2(this, _subscriptions)].map((subscription) => subscription.subscribe(this))
    );
  };
  class RpcSubscription {
    constructor(input) {
      this.subscriptionId = null;
      this.subscribed = false;
      this.input = input;
    }
    onMessage(message) {
      if (this.subscribed) {
        this.input.onMessage(message);
      }
    }
    async unsubscribe(client) {
      const { subscriptionId } = this;
      this.subscribed = false;
      if (subscriptionId == null)
        return false;
      this.subscriptionId = null;
      return client.makeRequest(this.input.unsubscribe, [subscriptionId]);
    }
    async subscribe(client) {
      this.subscriptionId = null;
      this.subscribed = true;
      const newSubscriptionId = await client.makeRequest(
        this.input.method,
        this.input.params
      );
      if (this.subscribed) {
        this.subscriptionId = newSubscriptionId;
      }
    }
  }
  var __accessCheck$1 = (obj, member, msg2) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg2);
  };
  var __privateGet$1 = (obj, member, getter) => {
    __accessCheck$1(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
  };
  var __privateAdd$1 = (obj, member, value2) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value2);
  };
  var __privateSet$1 = (obj, member, value2, setter) => {
    __accessCheck$1(obj, member, "write to private field");
    setter ? setter.call(obj, value2) : member.set(obj, value2);
    return value2;
  };
  var __privateMethod = (obj, member, method) => {
    __accessCheck$1(obj, member, "access private method");
    return method;
  };
  var _requestId, _options, _websocketClient, _getWebsocketClient, getWebsocketClient_fn;
  class SuiHTTPTransport {
    constructor(options) {
      __privateAdd$1(this, _getWebsocketClient);
      __privateAdd$1(this, _requestId, 0);
      __privateAdd$1(this, _options, void 0);
      __privateAdd$1(this, _websocketClient, void 0);
      __privateSet$1(this, _options, options);
    }
    fetch(input, init) {
      const fetch2 = __privateGet$1(this, _options).fetch ?? globalThis.fetch;
      if (!fetch2) {
        throw new Error(
          "The current environment does not support fetch, you can provide a fetch implementation in the options for SuiHTTPTransport."
        );
      }
      return fetch2(input, init);
    }
    async request(input) {
      var _a, _b;
      __privateSet$1(this, _requestId, __privateGet$1(this, _requestId) + 1);
      const res = await this.fetch(((_a = __privateGet$1(this, _options).rpc) == null ? void 0 : _a.url) ?? __privateGet$1(this, _options).url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Sdk-Type": "typescript",
          "Client-Sdk-Version": PACKAGE_VERSION,
          "Client-Target-Api-Version": TARGETED_RPC_VERSION,
          ...(_b = __privateGet$1(this, _options).rpc) == null ? void 0 : _b.headers
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: __privateGet$1(this, _requestId),
          method: input.method,
          params: input.params
        })
      });
      if (!res.ok) {
        throw new SuiHTTPStatusError(
          `Unexpected status code: ${res.status}`,
          res.status,
          res.statusText
        );
      }
      const data = await res.json();
      if ("error" in data && data.error != null) {
        throw new JsonRpcError(data.error.message, data.error.code);
      }
      return data.result;
    }
    async subscribe(input) {
      const unsubscribe = await __privateMethod(this, _getWebsocketClient, getWebsocketClient_fn).call(this).subscribe(input);
      return async () => !!await unsubscribe();
    }
  }
  _requestId = /* @__PURE__ */ new WeakMap();
  _options = /* @__PURE__ */ new WeakMap();
  _websocketClient = /* @__PURE__ */ new WeakMap();
  _getWebsocketClient = /* @__PURE__ */ new WeakSet();
  getWebsocketClient_fn = function() {
    var _a;
    if (!__privateGet$1(this, _websocketClient)) {
      const WebSocketConstructor = __privateGet$1(this, _options).WebSocketConstructor ?? globalThis.WebSocket;
      if (!WebSocketConstructor) {
        throw new Error(
          "The current environment does not support WebSocket, you can provide a WebSocketConstructor in the options for SuiHTTPTransport."
        );
      }
      __privateSet$1(this, _websocketClient, new WebsocketClient(
        ((_a = __privateGet$1(this, _options).websocket) == null ? void 0 : _a.url) ?? __privateGet$1(this, _options).url,
        {
          WebSocketConstructor,
          ...__privateGet$1(this, _options).websocket
        }
      ));
    }
    return __privateGet$1(this, _websocketClient);
  };
  function getFullnodeUrl(network) {
    switch (network) {
      case "mainnet":
        return "https://fullnode.mainnet.sui.io:443";
      case "testnet":
        return "https://fullnode.testnet.sui.io:443";
      case "devnet":
        return "https://fullnode.devnet.sui.io:443";
      case "localnet":
        return "http://127.0.0.1:9000";
      default:
        throw new Error(`Unknown network: ${network}`);
    }
  }
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  function base$1(ALPHABET2) {
    if (ALPHABET2.length >= 255) {
      throw new TypeError("Alphabet too long");
    }
    var BASE_MAP = new Uint8Array(256);
    for (var j = 0; j < BASE_MAP.length; j++) {
      BASE_MAP[j] = 255;
    }
    for (var i2 = 0; i2 < ALPHABET2.length; i2++) {
      var x = ALPHABET2.charAt(i2);
      var xc = x.charCodeAt(0);
      if (BASE_MAP[xc] !== 255) {
        throw new TypeError(x + " is ambiguous");
      }
      BASE_MAP[xc] = i2;
    }
    var BASE = ALPHABET2.length;
    var LEADER = ALPHABET2.charAt(0);
    var FACTOR = Math.log(BASE) / Math.log(256);
    var iFACTOR = Math.log(256) / Math.log(BASE);
    function encode(source) {
      if (source instanceof Uint8Array)
        ;
      else if (ArrayBuffer.isView(source)) {
        source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
      } else if (Array.isArray(source)) {
        source = Uint8Array.from(source);
      }
      if (!(source instanceof Uint8Array)) {
        throw new TypeError("Expected Uint8Array");
      }
      if (source.length === 0) {
        return "";
      }
      var zeroes = 0;
      var length = 0;
      var pbegin = 0;
      var pend = source.length;
      while (pbegin !== pend && source[pbegin] === 0) {
        pbegin++;
        zeroes++;
      }
      var size2 = (pend - pbegin) * iFACTOR + 1 >>> 0;
      var b58 = new Uint8Array(size2);
      while (pbegin !== pend) {
        var carry = source[pbegin];
        var i3 = 0;
        for (var it1 = size2 - 1; (carry !== 0 || i3 < length) && it1 !== -1; it1--, i3++) {
          carry += 256 * b58[it1] >>> 0;
          b58[it1] = carry % BASE >>> 0;
          carry = carry / BASE >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length = i3;
        pbegin++;
      }
      var it2 = size2 - length;
      while (it2 !== size2 && b58[it2] === 0) {
        it2++;
      }
      var str = LEADER.repeat(zeroes);
      for (; it2 < size2; ++it2) {
        str += ALPHABET2.charAt(b58[it2]);
      }
      return str;
    }
    function decodeUnsafe(source) {
      if (typeof source !== "string") {
        throw new TypeError("Expected String");
      }
      if (source.length === 0) {
        return new Uint8Array();
      }
      var psz = 0;
      var zeroes = 0;
      var length = 0;
      while (source[psz] === LEADER) {
        zeroes++;
        psz++;
      }
      var size2 = (source.length - psz) * FACTOR + 1 >>> 0;
      var b256 = new Uint8Array(size2);
      while (source[psz]) {
        var carry = BASE_MAP[source.charCodeAt(psz)];
        if (carry === 255) {
          return;
        }
        var i3 = 0;
        for (var it3 = size2 - 1; (carry !== 0 || i3 < length) && it3 !== -1; it3--, i3++) {
          carry += BASE * b256[it3] >>> 0;
          b256[it3] = carry % 256 >>> 0;
          carry = carry / 256 >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length = i3;
        psz++;
      }
      var it4 = size2 - length;
      while (it4 !== size2 && b256[it4] === 0) {
        it4++;
      }
      var vch = new Uint8Array(zeroes + (size2 - it4));
      var j2 = zeroes;
      while (it4 !== size2) {
        vch[j2++] = b256[it4++];
      }
      return vch;
    }
    function decode(string) {
      var buffer = decodeUnsafe(string);
      if (buffer) {
        return buffer;
      }
      throw new Error("Non-base" + BASE + " character");
    }
    return {
      encode,
      decodeUnsafe,
      decode
    };
  }
  var src = base$1;
  const basex = src;
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  var bs58 = basex(ALPHABET);
  const bs58$1 = /* @__PURE__ */ getDefaultExportFromCjs(bs58);
  const fromB58 = (str) => bs58$1.decode(str);
  const CHUNK_SIZE = 8192;
  function toB64(bytes) {
    if (bytes.length < CHUNK_SIZE) {
      return btoa(String.fromCharCode(...bytes));
    }
    let output = "";
    for (var i2 = 0; i2 < bytes.length; i2 += CHUNK_SIZE) {
      const chunk = bytes.slice(i2, i2 + CHUNK_SIZE);
      output += String.fromCharCode(...chunk);
    }
    return btoa(output);
  }
  function toHEX(bytes) {
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
  }
  const TX_DIGEST_LENGTH = 32;
  function isValidTransactionDigest(value2) {
    try {
      const buffer = fromB58(value2);
      return buffer.length === TX_DIGEST_LENGTH;
    } catch (e2) {
      return false;
    }
  }
  const SUI_ADDRESS_LENGTH = 32;
  function isValidSuiAddress(value2) {
    return isHex(value2) && getHexByteLength(value2) === SUI_ADDRESS_LENGTH;
  }
  function isValidSuiObjectId(value2) {
    return isValidSuiAddress(value2);
  }
  function normalizeSuiAddress(value2, forceAdd0x = false) {
    let address = value2.toLowerCase();
    if (!forceAdd0x && address.startsWith("0x")) {
      address = address.slice(2);
    }
    return `0x${address.padStart(SUI_ADDRESS_LENGTH * 2, "0")}`;
  }
  function normalizeSuiObjectId(value2, forceAdd0x = false) {
    return normalizeSuiAddress(value2, forceAdd0x);
  }
  function isHex(value2) {
    return /^(0x|0X)?[a-fA-F0-9]+$/.test(value2) && value2.length % 2 === 0;
  }
  function getHexByteLength(value2) {
    return /^(0x|0X)/.test(value2) ? (value2.length - 2) / 2 : value2.length / 2;
  }
  const TRANSACTION_BRAND = Symbol.for("@mysten/transaction");
  function isTransactionBlock(obj) {
    return !!obj && typeof obj === "object" && obj[TRANSACTION_BRAND] === true;
  }
  const SUI_CLIENT_BRAND = Symbol.for("@mysten/SuiClient");
  class SuiClient {
    get [SUI_CLIENT_BRAND]() {
      return true;
    }
    /**
     * Establish a connection to a Sui RPC endpoint
     *
     * @param options configuration options for the API Client
     */
    constructor(options) {
      this.transport = options.transport ?? new SuiHTTPTransport({ url: options.url });
    }
    async getRpcApiVersion() {
      const resp = await this.transport.request({
        method: "rpc.discover",
        params: []
      });
      return resp.info.version;
    }
    /**
     * Get all Coin<`coin_type`> objects owned by an address.
     */
    async getCoins(input) {
      if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
        throw new Error("Invalid Sui address");
      }
      return await this.transport.request({
        method: "suix_getCoins",
        params: [input.owner, input.coinType, input.cursor, input.limit]
      });
    }
    /**
     * Get all Coin objects owned by an address.
     */
    async getAllCoins(input) {
      if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
        throw new Error("Invalid Sui address");
      }
      return await this.transport.request({
        method: "suix_getAllCoins",
        params: [input.owner, input.cursor, input.limit]
      });
    }
    /**
     * Get the total coin balance for one coin type, owned by the address owner.
     */
    async getBalance(input) {
      if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
        throw new Error("Invalid Sui address");
      }
      return await this.transport.request({
        method: "suix_getBalance",
        params: [input.owner, input.coinType]
      });
    }
    /**
     * Get the total coin balance for all coin types, owned by the address owner.
     */
    async getAllBalances(input) {
      if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
        throw new Error("Invalid Sui address");
      }
      return await this.transport.request({ method: "suix_getAllBalances", params: [input.owner] });
    }
    /**
     * Fetch CoinMetadata for a given coin type
     */
    async getCoinMetadata(input) {
      return await this.transport.request({
        method: "suix_getCoinMetadata",
        params: [input.coinType]
      });
    }
    /**
     *  Fetch total supply for a coin
     */
    async getTotalSupply(input) {
      return await this.transport.request({
        method: "suix_getTotalSupply",
        params: [input.coinType]
      });
    }
    /**
     * Invoke any RPC method
     * @param method the method to be invoked
     * @param args the arguments to be passed to the RPC request
     */
    async call(method, params) {
      return await this.transport.request({ method, params });
    }
    /**
     * Get Move function argument types like read, write and full access
     */
    async getMoveFunctionArgTypes(input) {
      return await this.transport.request({
        method: "sui_getMoveFunctionArgTypes",
        params: [input.package, input.module, input.function]
      });
    }
    /**
     * Get a map from module name to
     * structured representations of Move modules
     */
    async getNormalizedMoveModulesByPackage(input) {
      return await this.transport.request({
        method: "sui_getNormalizedMoveModulesByPackage",
        params: [input.package]
      });
    }
    /**
     * Get a structured representation of Move module
     */
    async getNormalizedMoveModule(input) {
      return await this.transport.request({
        method: "sui_getNormalizedMoveModule",
        params: [input.package, input.module]
      });
    }
    /**
     * Get a structured representation of Move function
     */
    async getNormalizedMoveFunction(input) {
      return await this.transport.request({
        method: "sui_getNormalizedMoveFunction",
        params: [input.package, input.module, input.function]
      });
    }
    /**
     * Get a structured representation of Move struct
     */
    async getNormalizedMoveStruct(input) {
      return await this.transport.request({
        method: "sui_getNormalizedMoveStruct",
        params: [input.package, input.module, input.struct]
      });
    }
    /**
     * Get all objects owned by an address
     */
    async getOwnedObjects(input) {
      if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
        throw new Error("Invalid Sui address");
      }
      return await this.transport.request({
        method: "suix_getOwnedObjects",
        params: [
          input.owner,
          {
            filter: input.filter,
            options: input.options
          },
          input.cursor,
          input.limit
        ]
      });
    }
    /**
     * Get details about an object
     */
    async getObject(input) {
      if (!input.id || !isValidSuiObjectId(normalizeSuiObjectId(input.id))) {
        throw new Error("Invalid Sui Object id");
      }
      return await this.transport.request({
        method: "sui_getObject",
        params: [input.id, input.options]
      });
    }
    async tryGetPastObject(input) {
      return await this.transport.request({
        method: "sui_tryGetPastObject",
        params: [input.id, input.version, input.options]
      });
    }
    /**
     * Batch get details about a list of objects. If any of the object ids are duplicates the call will fail
     */
    async multiGetObjects(input) {
      input.ids.forEach((id) => {
        if (!id || !isValidSuiObjectId(normalizeSuiObjectId(id))) {
          throw new Error(`Invalid Sui Object id ${id}`);
        }
      });
      const hasDuplicates = input.ids.length !== new Set(input.ids).size;
      if (hasDuplicates) {
        throw new Error(`Duplicate object ids in batch call ${input.ids}`);
      }
      return await this.transport.request({
        method: "sui_multiGetObjects",
        params: [input.ids, input.options]
      });
    }
    /**
     * Get transaction blocks for a given query criteria
     */
    async queryTransactionBlocks(input) {
      return await this.transport.request({
        method: "suix_queryTransactionBlocks",
        params: [
          {
            filter: input.filter,
            options: input.options
          },
          input.cursor,
          input.limit,
          (input.order || "descending") === "descending"
        ]
      });
    }
    async getTransactionBlock(input) {
      if (!isValidTransactionDigest(input.digest)) {
        throw new Error("Invalid Transaction digest");
      }
      return await this.transport.request({
        method: "sui_getTransactionBlock",
        params: [input.digest, input.options]
      });
    }
    async multiGetTransactionBlocks(input) {
      input.digests.forEach((d2) => {
        if (!isValidTransactionDigest(d2)) {
          throw new Error(`Invalid Transaction digest ${d2}`);
        }
      });
      const hasDuplicates = input.digests.length !== new Set(input.digests).size;
      if (hasDuplicates) {
        throw new Error(`Duplicate digests in batch call ${input.digests}`);
      }
      return await this.transport.request({
        method: "sui_multiGetTransactionBlocks",
        params: [input.digests, input.options]
      });
    }
    async executeTransactionBlock(input) {
      return await this.transport.request({
        method: "sui_executeTransactionBlock",
        params: [
          typeof input.transactionBlock === "string" ? input.transactionBlock : toB64(input.transactionBlock),
          Array.isArray(input.signature) ? input.signature : [input.signature],
          input.options,
          input.requestType
        ]
      });
    }
    async signAndExecuteTransactionBlock({
      transactionBlock,
      signer,
      ...input
    }) {
      let transactionBytes;
      if (transactionBlock instanceof Uint8Array) {
        transactionBytes = transactionBlock;
      } else {
        transactionBlock.setSenderIfNotSet(signer.toSuiAddress());
        transactionBytes = await transactionBlock.build({ client: this });
      }
      const { signature, bytes } = await signer.signTransactionBlock(transactionBytes);
      return this.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        ...input
      });
    }
    /**
     * Get total number of transactions
     */
    async getTotalTransactionBlocks() {
      const resp = await this.transport.request({
        method: "sui_getTotalTransactionBlocks",
        params: []
      });
      return BigInt(resp);
    }
    /**
     * Getting the reference gas price for the network
     */
    async getReferenceGasPrice() {
      const resp = await this.transport.request({
        method: "suix_getReferenceGasPrice",
        params: []
      });
      return BigInt(resp);
    }
    /**
     * Return the delegated stakes for an address
     */
    async getStakes(input) {
      if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
        throw new Error("Invalid Sui address");
      }
      return await this.transport.request({ method: "suix_getStakes", params: [input.owner] });
    }
    /**
     * Return the delegated stakes queried by id.
     */
    async getStakesByIds(input) {
      input.stakedSuiIds.forEach((id) => {
        if (!id || !isValidSuiObjectId(normalizeSuiObjectId(id))) {
          throw new Error(`Invalid Sui Stake id ${id}`);
        }
      });
      return await this.transport.request({
        method: "suix_getStakesByIds",
        params: [input.stakedSuiIds]
      });
    }
    /**
     * Return the latest system state content.
     */
    async getLatestSuiSystemState() {
      return await this.transport.request({ method: "suix_getLatestSuiSystemState", params: [] });
    }
    /**
     * Get events for a given query criteria
     */
    async queryEvents(input) {
      return await this.transport.request({
        method: "suix_queryEvents",
        params: [
          input.query,
          input.cursor,
          input.limit,
          (input.order || "descending") === "descending"
        ]
      });
    }
    /**
     * Subscribe to get notifications whenever an event matching the filter occurs
     */
    async subscribeEvent(input) {
      return this.transport.subscribe({
        method: "suix_subscribeEvent",
        unsubscribe: "suix_unsubscribeEvent",
        params: [input.filter],
        onMessage: input.onMessage
      });
    }
    async subscribeTransaction(input) {
      return this.transport.subscribe({
        method: "suix_subscribeTransaction",
        unsubscribe: "suix_unsubscribeTransaction",
        params: [input.filter],
        onMessage: input.onMessage
      });
    }
    /**
     * Runs the transaction block in dev-inspect mode. Which allows for nearly any
     * transaction (or Move call) with any arguments. Detailed results are
     * provided, including both the transaction effects and any return values.
     */
    async devInspectTransactionBlock(input) {
      var _a;
      let devInspectTxBytes;
      if (isTransactionBlock(input.transactionBlock)) {
        input.transactionBlock.setSenderIfNotSet(input.sender);
        devInspectTxBytes = toB64(
          await input.transactionBlock.build({
            client: this,
            onlyTransactionKind: true
          })
        );
      } else if (typeof input.transactionBlock === "string") {
        devInspectTxBytes = input.transactionBlock;
      } else if (input.transactionBlock instanceof Uint8Array) {
        devInspectTxBytes = toB64(input.transactionBlock);
      } else {
        throw new Error("Unknown transaction block format.");
      }
      return await this.transport.request({
        method: "sui_devInspectTransactionBlock",
        params: [input.sender, devInspectTxBytes, (_a = input.gasPrice) == null ? void 0 : _a.toString(), input.epoch]
      });
    }
    /**
     * Dry run a transaction block and return the result.
     */
    async dryRunTransactionBlock(input) {
      return await this.transport.request({
        method: "sui_dryRunTransactionBlock",
        params: [
          typeof input.transactionBlock === "string" ? input.transactionBlock : toB64(input.transactionBlock)
        ]
      });
    }
    /**
     * Return the list of dynamic field objects owned by an object
     */
    async getDynamicFields(input) {
      if (!input.parentId || !isValidSuiObjectId(normalizeSuiObjectId(input.parentId))) {
        throw new Error("Invalid Sui Object id");
      }
      return await this.transport.request({
        method: "suix_getDynamicFields",
        params: [input.parentId, input.cursor, input.limit]
      });
    }
    /**
     * Return the dynamic field object information for a specified object
     */
    async getDynamicFieldObject(input) {
      return await this.transport.request({
        method: "suix_getDynamicFieldObject",
        params: [input.parentId, input.name]
      });
    }
    /**
     * Get the sequence number of the latest checkpoint that has been executed
     */
    async getLatestCheckpointSequenceNumber() {
      const resp = await this.transport.request({
        method: "sui_getLatestCheckpointSequenceNumber",
        params: []
      });
      return String(resp);
    }
    /**
     * Returns information about a given checkpoint
     */
    async getCheckpoint(input) {
      return await this.transport.request({ method: "sui_getCheckpoint", params: [input.id] });
    }
    /**
     * Returns historical checkpoints paginated
     */
    async getCheckpoints(input) {
      return await this.transport.request({
        method: "sui_getCheckpoints",
        params: [input.cursor, input == null ? void 0 : input.limit, input.descendingOrder]
      });
    }
    /**
     * Return the committee information for the asked epoch
     */
    async getCommitteeInfo(input) {
      return await this.transport.request({
        method: "suix_getCommitteeInfo",
        params: [input == null ? void 0 : input.epoch]
      });
    }
    async getNetworkMetrics() {
      return await this.transport.request({ method: "suix_getNetworkMetrics", params: [] });
    }
    async getAddressMetrics() {
      return await this.transport.request({ method: "suix_getLatestAddressMetrics", params: [] });
    }
    async getEpochMetrics(input) {
      return await this.transport.request({
        method: "suix_getEpochMetrics",
        params: [input == null ? void 0 : input.cursor, input == null ? void 0 : input.limit, input == null ? void 0 : input.descendingOrder]
      });
    }
    async getAllEpochAddressMetrics(input) {
      return await this.transport.request({
        method: "suix_getAllEpochAddressMetrics",
        params: [input == null ? void 0 : input.descendingOrder]
      });
    }
    /**
     * Return the committee information for the asked epoch
     */
    async getEpochs(input) {
      return await this.transport.request({
        method: "suix_getEpochs",
        params: [input == null ? void 0 : input.cursor, input == null ? void 0 : input.limit, input == null ? void 0 : input.descendingOrder]
      });
    }
    /**
     * Returns list of top move calls by usage
     */
    async getMoveCallMetrics() {
      return await this.transport.request({ method: "suix_getMoveCallMetrics", params: [] });
    }
    /**
     * Return the committee information for the asked epoch
     */
    async getCurrentEpoch() {
      return await this.transport.request({ method: "suix_getCurrentEpoch", params: [] });
    }
    /**
     * Return the Validators APYs
     */
    async getValidatorsApy() {
      return await this.transport.request({ method: "suix_getValidatorsApy", params: [] });
    }
    // TODO: Migrate this to `sui_getChainIdentifier` once it is widely available.
    async getChainIdentifier() {
      const checkpoint = await this.getCheckpoint({ id: "0" });
      const bytes = fromB58(checkpoint.digest);
      return toHEX(bytes.slice(0, 4));
    }
    async resolveNameServiceAddress(input) {
      return await this.transport.request({
        method: "suix_resolveNameServiceAddress",
        params: [input.name]
      });
    }
    async resolveNameServiceNames(input) {
      return await this.transport.request({
        method: "suix_resolveNameServiceNames",
        params: [input.address, input.cursor, input.limit]
      });
    }
    async getProtocolConfig(input) {
      return await this.transport.request({
        method: "sui_getProtocolConfig",
        params: [input == null ? void 0 : input.version]
      });
    }
    /**
     * Wait for a transaction block result to be available over the API.
     * This can be used in conjunction with `executeTransactionBlock` to wait for the transaction to
     * be available via the API.
     * This currently polls the `getTransactionBlock` API to check for the transaction.
     */
    async waitForTransactionBlock({
      signal,
      timeout = 60 * 1e3,
      pollInterval = 2 * 1e3,
      ...input
    }) {
      const timeoutSignal = AbortSignal.timeout(timeout);
      const timeoutPromise = new Promise((_, reject) => {
        timeoutSignal.addEventListener("abort", () => reject(timeoutSignal.reason));
      });
      timeoutPromise.catch(() => {
      });
      while (!timeoutSignal.aborted) {
        signal == null ? void 0 : signal.throwIfAborted();
        try {
          return await this.getTransactionBlock(input);
        } catch (e2) {
          await Promise.race([
            new Promise((resolve) => setTimeout(resolve, pollInterval)),
            timeoutPromise
          ]);
        }
      }
      timeoutSignal.throwIfAborted();
      throw new Error("Unexpected error while waiting for transaction block.");
    }
  }
  function devAssert(condition, message) {
    const booleanCondition = Boolean(condition);
    if (!booleanCondition) {
      throw new Error(message);
    }
  }
  const QueryDocumentKeys = {
    Name: [],
    Document: ["definitions"],
    OperationDefinition: [
      "name",
      "variableDefinitions",
      "directives",
      "selectionSet"
    ],
    VariableDefinition: ["variable", "type", "defaultValue", "directives"],
    Variable: ["name"],
    SelectionSet: ["selections"],
    Field: ["alias", "name", "arguments", "directives", "selectionSet"],
    Argument: ["name", "value"],
    FragmentSpread: ["name", "directives"],
    InlineFragment: ["typeCondition", "directives", "selectionSet"],
    FragmentDefinition: [
      "name",
      // Note: fragment variable definitions are deprecated and will removed in v17.0.0
      "variableDefinitions",
      "typeCondition",
      "directives",
      "selectionSet"
    ],
    IntValue: [],
    FloatValue: [],
    StringValue: [],
    BooleanValue: [],
    NullValue: [],
    EnumValue: [],
    ListValue: ["values"],
    ObjectValue: ["fields"],
    ObjectField: ["name", "value"],
    Directive: ["name", "arguments"],
    NamedType: ["name"],
    ListType: ["type"],
    NonNullType: ["type"],
    SchemaDefinition: ["description", "directives", "operationTypes"],
    OperationTypeDefinition: ["type"],
    ScalarTypeDefinition: ["description", "name", "directives"],
    ObjectTypeDefinition: [
      "description",
      "name",
      "interfaces",
      "directives",
      "fields"
    ],
    FieldDefinition: ["description", "name", "arguments", "type", "directives"],
    InputValueDefinition: [
      "description",
      "name",
      "type",
      "defaultValue",
      "directives"
    ],
    InterfaceTypeDefinition: [
      "description",
      "name",
      "interfaces",
      "directives",
      "fields"
    ],
    UnionTypeDefinition: ["description", "name", "directives", "types"],
    EnumTypeDefinition: ["description", "name", "directives", "values"],
    EnumValueDefinition: ["description", "name", "directives"],
    InputObjectTypeDefinition: ["description", "name", "directives", "fields"],
    DirectiveDefinition: ["description", "name", "arguments", "locations"],
    SchemaExtension: ["directives", "operationTypes"],
    ScalarTypeExtension: ["name", "directives"],
    ObjectTypeExtension: ["name", "interfaces", "directives", "fields"],
    InterfaceTypeExtension: ["name", "interfaces", "directives", "fields"],
    UnionTypeExtension: ["name", "directives", "types"],
    EnumTypeExtension: ["name", "directives", "values"],
    InputObjectTypeExtension: ["name", "directives", "fields"]
  };
  const kindValues = new Set(Object.keys(QueryDocumentKeys));
  function isNode(maybeNode) {
    const maybeKind = maybeNode === null || maybeNode === void 0 ? void 0 : maybeNode.kind;
    return typeof maybeKind === "string" && kindValues.has(maybeKind);
  }
  var OperationTypeNode;
  (function(OperationTypeNode2) {
    OperationTypeNode2["QUERY"] = "query";
    OperationTypeNode2["MUTATION"] = "mutation";
    OperationTypeNode2["SUBSCRIPTION"] = "subscription";
  })(OperationTypeNode || (OperationTypeNode = {}));
  var Kind;
  (function(Kind2) {
    Kind2["NAME"] = "Name";
    Kind2["DOCUMENT"] = "Document";
    Kind2["OPERATION_DEFINITION"] = "OperationDefinition";
    Kind2["VARIABLE_DEFINITION"] = "VariableDefinition";
    Kind2["SELECTION_SET"] = "SelectionSet";
    Kind2["FIELD"] = "Field";
    Kind2["ARGUMENT"] = "Argument";
    Kind2["FRAGMENT_SPREAD"] = "FragmentSpread";
    Kind2["INLINE_FRAGMENT"] = "InlineFragment";
    Kind2["FRAGMENT_DEFINITION"] = "FragmentDefinition";
    Kind2["VARIABLE"] = "Variable";
    Kind2["INT"] = "IntValue";
    Kind2["FLOAT"] = "FloatValue";
    Kind2["STRING"] = "StringValue";
    Kind2["BOOLEAN"] = "BooleanValue";
    Kind2["NULL"] = "NullValue";
    Kind2["ENUM"] = "EnumValue";
    Kind2["LIST"] = "ListValue";
    Kind2["OBJECT"] = "ObjectValue";
    Kind2["OBJECT_FIELD"] = "ObjectField";
    Kind2["DIRECTIVE"] = "Directive";
    Kind2["NAMED_TYPE"] = "NamedType";
    Kind2["LIST_TYPE"] = "ListType";
    Kind2["NON_NULL_TYPE"] = "NonNullType";
    Kind2["SCHEMA_DEFINITION"] = "SchemaDefinition";
    Kind2["OPERATION_TYPE_DEFINITION"] = "OperationTypeDefinition";
    Kind2["SCALAR_TYPE_DEFINITION"] = "ScalarTypeDefinition";
    Kind2["OBJECT_TYPE_DEFINITION"] = "ObjectTypeDefinition";
    Kind2["FIELD_DEFINITION"] = "FieldDefinition";
    Kind2["INPUT_VALUE_DEFINITION"] = "InputValueDefinition";
    Kind2["INTERFACE_TYPE_DEFINITION"] = "InterfaceTypeDefinition";
    Kind2["UNION_TYPE_DEFINITION"] = "UnionTypeDefinition";
    Kind2["ENUM_TYPE_DEFINITION"] = "EnumTypeDefinition";
    Kind2["ENUM_VALUE_DEFINITION"] = "EnumValueDefinition";
    Kind2["INPUT_OBJECT_TYPE_DEFINITION"] = "InputObjectTypeDefinition";
    Kind2["DIRECTIVE_DEFINITION"] = "DirectiveDefinition";
    Kind2["SCHEMA_EXTENSION"] = "SchemaExtension";
    Kind2["SCALAR_TYPE_EXTENSION"] = "ScalarTypeExtension";
    Kind2["OBJECT_TYPE_EXTENSION"] = "ObjectTypeExtension";
    Kind2["INTERFACE_TYPE_EXTENSION"] = "InterfaceTypeExtension";
    Kind2["UNION_TYPE_EXTENSION"] = "UnionTypeExtension";
    Kind2["ENUM_TYPE_EXTENSION"] = "EnumTypeExtension";
    Kind2["INPUT_OBJECT_TYPE_EXTENSION"] = "InputObjectTypeExtension";
  })(Kind || (Kind = {}));
  function isWhiteSpace(code) {
    return code === 9 || code === 32;
  }
  function printBlockString(value2, options) {
    const escapedValue = value2.replace(/"""/g, '\\"""');
    const lines = escapedValue.split(/\r\n|[\n\r]/g);
    const isSingleLine = lines.length === 1;
    const forceLeadingNewLine = lines.length > 1 && lines.slice(1).every((line) => line.length === 0 || isWhiteSpace(line.charCodeAt(0)));
    const hasTrailingTripleQuotes = escapedValue.endsWith('\\"""');
    const hasTrailingQuote = value2.endsWith('"') && !hasTrailingTripleQuotes;
    const hasTrailingSlash = value2.endsWith("\\");
    const forceTrailingNewline = hasTrailingQuote || hasTrailingSlash;
    const printAsMultipleLines = !(options !== null && options !== void 0 && options.minimize) && // add leading and trailing new lines only if it improves readability
    (!isSingleLine || value2.length > 70 || forceTrailingNewline || forceLeadingNewLine || hasTrailingTripleQuotes);
    let result = "";
    const skipLeadingNewLine = isSingleLine && isWhiteSpace(value2.charCodeAt(0));
    if (printAsMultipleLines && !skipLeadingNewLine || forceLeadingNewLine) {
      result += "\n";
    }
    result += escapedValue;
    if (printAsMultipleLines || forceTrailingNewline) {
      result += "\n";
    }
    return '"""' + result + '"""';
  }
  const MAX_ARRAY_LENGTH = 10;
  const MAX_RECURSIVE_DEPTH = 2;
  function inspect(value2) {
    return formatValue(value2, []);
  }
  function formatValue(value2, seenValues) {
    switch (typeof value2) {
      case "string":
        return JSON.stringify(value2);
      case "function":
        return value2.name ? `[function ${value2.name}]` : "[function]";
      case "object":
        return formatObjectValue(value2, seenValues);
      default:
        return String(value2);
    }
  }
  function formatObjectValue(value2, previouslySeenValues) {
    if (value2 === null) {
      return "null";
    }
    if (previouslySeenValues.includes(value2)) {
      return "[Circular]";
    }
    const seenValues = [...previouslySeenValues, value2];
    if (isJSONable(value2)) {
      const jsonValue = value2.toJSON();
      if (jsonValue !== value2) {
        return typeof jsonValue === "string" ? jsonValue : formatValue(jsonValue, seenValues);
      }
    } else if (Array.isArray(value2)) {
      return formatArray(value2, seenValues);
    }
    return formatObject(value2, seenValues);
  }
  function isJSONable(value2) {
    return typeof value2.toJSON === "function";
  }
  function formatObject(object, seenValues) {
    const entries = Object.entries(object);
    if (entries.length === 0) {
      return "{}";
    }
    if (seenValues.length > MAX_RECURSIVE_DEPTH) {
      return "[" + getObjectTag(object) + "]";
    }
    const properties = entries.map(
      ([key, value2]) => key + ": " + formatValue(value2, seenValues)
    );
    return "{ " + properties.join(", ") + " }";
  }
  function formatArray(array, seenValues) {
    if (array.length === 0) {
      return "[]";
    }
    if (seenValues.length > MAX_RECURSIVE_DEPTH) {
      return "[Array]";
    }
    const len = Math.min(MAX_ARRAY_LENGTH, array.length);
    const remaining = array.length - len;
    const items = [];
    for (let i2 = 0; i2 < len; ++i2) {
      items.push(formatValue(array[i2], seenValues));
    }
    if (remaining === 1) {
      items.push("... 1 more item");
    } else if (remaining > 1) {
      items.push(`... ${remaining} more items`);
    }
    return "[" + items.join(", ") + "]";
  }
  function getObjectTag(object) {
    const tag = Object.prototype.toString.call(object).replace(/^\[object /, "").replace(/]$/, "");
    if (tag === "Object" && typeof object.constructor === "function") {
      const name = object.constructor.name;
      if (typeof name === "string" && name !== "") {
        return name;
      }
    }
    return tag;
  }
  function printString(str) {
    return `"${str.replace(escapedRegExp, escapedReplacer)}"`;
  }
  const escapedRegExp = /[\x00-\x1f\x22\x5c\x7f-\x9f]/g;
  function escapedReplacer(str) {
    return escapeSequences[str.charCodeAt(0)];
  }
  const escapeSequences = [
    "\\u0000",
    "\\u0001",
    "\\u0002",
    "\\u0003",
    "\\u0004",
    "\\u0005",
    "\\u0006",
    "\\u0007",
    "\\b",
    "\\t",
    "\\n",
    "\\u000B",
    "\\f",
    "\\r",
    "\\u000E",
    "\\u000F",
    "\\u0010",
    "\\u0011",
    "\\u0012",
    "\\u0013",
    "\\u0014",
    "\\u0015",
    "\\u0016",
    "\\u0017",
    "\\u0018",
    "\\u0019",
    "\\u001A",
    "\\u001B",
    "\\u001C",
    "\\u001D",
    "\\u001E",
    "\\u001F",
    "",
    "",
    '\\"',
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    // 2F
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    // 3F
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    // 4F
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "\\\\",
    "",
    "",
    "",
    // 5F
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    // 6F
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "\\u007F",
    "\\u0080",
    "\\u0081",
    "\\u0082",
    "\\u0083",
    "\\u0084",
    "\\u0085",
    "\\u0086",
    "\\u0087",
    "\\u0088",
    "\\u0089",
    "\\u008A",
    "\\u008B",
    "\\u008C",
    "\\u008D",
    "\\u008E",
    "\\u008F",
    "\\u0090",
    "\\u0091",
    "\\u0092",
    "\\u0093",
    "\\u0094",
    "\\u0095",
    "\\u0096",
    "\\u0097",
    "\\u0098",
    "\\u0099",
    "\\u009A",
    "\\u009B",
    "\\u009C",
    "\\u009D",
    "\\u009E",
    "\\u009F"
  ];
  const BREAK = Object.freeze({});
  function visit(root2, visitor, visitorKeys = QueryDocumentKeys) {
    const enterLeaveMap = /* @__PURE__ */ new Map();
    for (const kind of Object.values(Kind)) {
      enterLeaveMap.set(kind, getEnterLeaveForKind(visitor, kind));
    }
    let stack2 = void 0;
    let inArray = Array.isArray(root2);
    let keys = [root2];
    let index = -1;
    let edits = [];
    let node = root2;
    let key = void 0;
    let parent = void 0;
    const path = [];
    const ancestors = [];
    do {
      index++;
      const isLeaving = index === keys.length;
      const isEdited = isLeaving && edits.length !== 0;
      if (isLeaving) {
        key = ancestors.length === 0 ? void 0 : path[path.length - 1];
        node = parent;
        parent = ancestors.pop();
        if (isEdited) {
          if (inArray) {
            node = node.slice();
            let editOffset = 0;
            for (const [editKey, editValue] of edits) {
              const arrayKey = editKey - editOffset;
              if (editValue === null) {
                node.splice(arrayKey, 1);
                editOffset++;
              } else {
                node[arrayKey] = editValue;
              }
            }
          } else {
            node = Object.defineProperties(
              {},
              Object.getOwnPropertyDescriptors(node)
            );
            for (const [editKey, editValue] of edits) {
              node[editKey] = editValue;
            }
          }
        }
        index = stack2.index;
        keys = stack2.keys;
        edits = stack2.edits;
        inArray = stack2.inArray;
        stack2 = stack2.prev;
      } else if (parent) {
        key = inArray ? index : keys[index];
        node = parent[key];
        if (node === null || node === void 0) {
          continue;
        }
        path.push(key);
      }
      let result;
      if (!Array.isArray(node)) {
        var _enterLeaveMap$get, _enterLeaveMap$get2;
        isNode(node) || devAssert(false, `Invalid AST Node: ${inspect(node)}.`);
        const visitFn = isLeaving ? (_enterLeaveMap$get = enterLeaveMap.get(node.kind)) === null || _enterLeaveMap$get === void 0 ? void 0 : _enterLeaveMap$get.leave : (_enterLeaveMap$get2 = enterLeaveMap.get(node.kind)) === null || _enterLeaveMap$get2 === void 0 ? void 0 : _enterLeaveMap$get2.enter;
        result = visitFn === null || visitFn === void 0 ? void 0 : visitFn.call(visitor, node, key, parent, path, ancestors);
        if (result === BREAK) {
          break;
        }
        if (result === false) {
          if (!isLeaving) {
            path.pop();
            continue;
          }
        } else if (result !== void 0) {
          edits.push([key, result]);
          if (!isLeaving) {
            if (isNode(result)) {
              node = result;
            } else {
              path.pop();
              continue;
            }
          }
        }
      }
      if (result === void 0 && isEdited) {
        edits.push([key, node]);
      }
      if (isLeaving) {
        path.pop();
      } else {
        var _node$kind;
        stack2 = {
          inArray,
          index,
          keys,
          edits,
          prev: stack2
        };
        inArray = Array.isArray(node);
        keys = inArray ? node : (_node$kind = visitorKeys[node.kind]) !== null && _node$kind !== void 0 ? _node$kind : [];
        index = -1;
        edits = [];
        if (parent) {
          ancestors.push(parent);
        }
        parent = node;
      }
    } while (stack2 !== void 0);
    if (edits.length !== 0) {
      return edits[edits.length - 1][1];
    }
    return root2;
  }
  function getEnterLeaveForKind(visitor, kind) {
    const kindVisitor = visitor[kind];
    if (typeof kindVisitor === "object") {
      return kindVisitor;
    } else if (typeof kindVisitor === "function") {
      return {
        enter: kindVisitor,
        leave: void 0
      };
    }
    return {
      enter: visitor.enter,
      leave: visitor.leave
    };
  }
  function print(ast) {
    return visit(ast, printDocASTReducer);
  }
  const MAX_LINE_LENGTH = 80;
  const printDocASTReducer = {
    Name: {
      leave: (node) => node.value
    },
    Variable: {
      leave: (node) => "$" + node.name
    },
    // Document
    Document: {
      leave: (node) => join(node.definitions, "\n\n")
    },
    OperationDefinition: {
      leave(node) {
        const varDefs = wrap("(", join(node.variableDefinitions, ", "), ")");
        const prefix2 = join(
          [
            node.operation,
            join([node.name, varDefs]),
            join(node.directives, " ")
          ],
          " "
        );
        return (prefix2 === "query" ? "" : prefix2 + " ") + node.selectionSet;
      }
    },
    VariableDefinition: {
      leave: ({ variable, type: type2, defaultValue, directives: directives2 }) => variable + ": " + type2 + wrap(" = ", defaultValue) + wrap(" ", join(directives2, " "))
    },
    SelectionSet: {
      leave: ({ selections }) => block(selections)
    },
    Field: {
      leave({ alias, name, arguments: args, directives: directives2, selectionSet: selectionSet2 }) {
        const prefix2 = wrap("", alias, ": ") + name;
        let argsLine = prefix2 + wrap("(", join(args, ", "), ")");
        if (argsLine.length > MAX_LINE_LENGTH) {
          argsLine = prefix2 + wrap("(\n", indent(join(args, "\n")), "\n)");
        }
        return join([argsLine, join(directives2, " "), selectionSet2], " ");
      }
    },
    Argument: {
      leave: ({ name, value: value2 }) => name + ": " + value2
    },
    // Fragments
    FragmentSpread: {
      leave: ({ name, directives: directives2 }) => "..." + name + wrap(" ", join(directives2, " "))
    },
    InlineFragment: {
      leave: ({ typeCondition, directives: directives2, selectionSet: selectionSet2 }) => join(
        [
          "...",
          wrap("on ", typeCondition),
          join(directives2, " "),
          selectionSet2
        ],
        " "
      )
    },
    FragmentDefinition: {
      leave: ({ name, typeCondition, variableDefinitions, directives: directives2, selectionSet: selectionSet2 }) => (
        // or removed in the future.
        `fragment ${name}${wrap("(", join(variableDefinitions, ", "), ")")} on ${typeCondition} ${wrap("", join(directives2, " "), " ")}` + selectionSet2
      )
    },
    // Value
    IntValue: {
      leave: ({ value: value2 }) => value2
    },
    FloatValue: {
      leave: ({ value: value2 }) => value2
    },
    StringValue: {
      leave: ({ value: value2, block: isBlockString }) => isBlockString ? printBlockString(value2) : printString(value2)
    },
    BooleanValue: {
      leave: ({ value: value2 }) => value2 ? "true" : "false"
    },
    NullValue: {
      leave: () => "null"
    },
    EnumValue: {
      leave: ({ value: value2 }) => value2
    },
    ListValue: {
      leave: ({ values }) => "[" + join(values, ", ") + "]"
    },
    ObjectValue: {
      leave: ({ fields }) => "{" + join(fields, ", ") + "}"
    },
    ObjectField: {
      leave: ({ name, value: value2 }) => name + ": " + value2
    },
    // Directive
    Directive: {
      leave: ({ name, arguments: args }) => "@" + name + wrap("(", join(args, ", "), ")")
    },
    // Type
    NamedType: {
      leave: ({ name }) => name
    },
    ListType: {
      leave: ({ type: type2 }) => "[" + type2 + "]"
    },
    NonNullType: {
      leave: ({ type: type2 }) => type2 + "!"
    },
    // Type System Definitions
    SchemaDefinition: {
      leave: ({ description, directives: directives2, operationTypes }) => wrap("", description, "\n") + join(["schema", join(directives2, " "), block(operationTypes)], " ")
    },
    OperationTypeDefinition: {
      leave: ({ operation, type: type2 }) => operation + ": " + type2
    },
    ScalarTypeDefinition: {
      leave: ({ description, name, directives: directives2 }) => wrap("", description, "\n") + join(["scalar", name, join(directives2, " ")], " ")
    },
    ObjectTypeDefinition: {
      leave: ({ description, name, interfaces, directives: directives2, fields }) => wrap("", description, "\n") + join(
        [
          "type",
          name,
          wrap("implements ", join(interfaces, " & ")),
          join(directives2, " "),
          block(fields)
        ],
        " "
      )
    },
    FieldDefinition: {
      leave: ({ description, name, arguments: args, type: type2, directives: directives2 }) => wrap("", description, "\n") + name + (hasMultilineItems(args) ? wrap("(\n", indent(join(args, "\n")), "\n)") : wrap("(", join(args, ", "), ")")) + ": " + type2 + wrap(" ", join(directives2, " "))
    },
    InputValueDefinition: {
      leave: ({ description, name, type: type2, defaultValue, directives: directives2 }) => wrap("", description, "\n") + join(
        [name + ": " + type2, wrap("= ", defaultValue), join(directives2, " ")],
        " "
      )
    },
    InterfaceTypeDefinition: {
      leave: ({ description, name, interfaces, directives: directives2, fields }) => wrap("", description, "\n") + join(
        [
          "interface",
          name,
          wrap("implements ", join(interfaces, " & ")),
          join(directives2, " "),
          block(fields)
        ],
        " "
      )
    },
    UnionTypeDefinition: {
      leave: ({ description, name, directives: directives2, types }) => wrap("", description, "\n") + join(
        ["union", name, join(directives2, " "), wrap("= ", join(types, " | "))],
        " "
      )
    },
    EnumTypeDefinition: {
      leave: ({ description, name, directives: directives2, values }) => wrap("", description, "\n") + join(["enum", name, join(directives2, " "), block(values)], " ")
    },
    EnumValueDefinition: {
      leave: ({ description, name, directives: directives2 }) => wrap("", description, "\n") + join([name, join(directives2, " ")], " ")
    },
    InputObjectTypeDefinition: {
      leave: ({ description, name, directives: directives2, fields }) => wrap("", description, "\n") + join(["input", name, join(directives2, " "), block(fields)], " ")
    },
    DirectiveDefinition: {
      leave: ({ description, name, arguments: args, repeatable, locations }) => wrap("", description, "\n") + "directive @" + name + (hasMultilineItems(args) ? wrap("(\n", indent(join(args, "\n")), "\n)") : wrap("(", join(args, ", "), ")")) + (repeatable ? " repeatable" : "") + " on " + join(locations, " | ")
    },
    SchemaExtension: {
      leave: ({ directives: directives2, operationTypes }) => join(
        ["extend schema", join(directives2, " "), block(operationTypes)],
        " "
      )
    },
    ScalarTypeExtension: {
      leave: ({ name, directives: directives2 }) => join(["extend scalar", name, join(directives2, " ")], " ")
    },
    ObjectTypeExtension: {
      leave: ({ name, interfaces, directives: directives2, fields }) => join(
        [
          "extend type",
          name,
          wrap("implements ", join(interfaces, " & ")),
          join(directives2, " "),
          block(fields)
        ],
        " "
      )
    },
    InterfaceTypeExtension: {
      leave: ({ name, interfaces, directives: directives2, fields }) => join(
        [
          "extend interface",
          name,
          wrap("implements ", join(interfaces, " & ")),
          join(directives2, " "),
          block(fields)
        ],
        " "
      )
    },
    UnionTypeExtension: {
      leave: ({ name, directives: directives2, types }) => join(
        [
          "extend union",
          name,
          join(directives2, " "),
          wrap("= ", join(types, " | "))
        ],
        " "
      )
    },
    EnumTypeExtension: {
      leave: ({ name, directives: directives2, values }) => join(["extend enum", name, join(directives2, " "), block(values)], " ")
    },
    InputObjectTypeExtension: {
      leave: ({ name, directives: directives2, fields }) => join(["extend input", name, join(directives2, " "), block(fields)], " ")
    }
  };
  function join(maybeArray, separator = "") {
    var _maybeArray$filter$jo;
    return (_maybeArray$filter$jo = maybeArray === null || maybeArray === void 0 ? void 0 : maybeArray.filter((x) => x).join(separator)) !== null && _maybeArray$filter$jo !== void 0 ? _maybeArray$filter$jo : "";
  }
  function block(array) {
    return wrap("{\n", indent(join(array, "\n")), "\n}");
  }
  function wrap(start, maybeString, end = "") {
    return maybeString != null && maybeString !== "" ? start + maybeString + end : "";
  }
  function indent(str) {
    return wrap("  ", str.replace(/\n/g, "\n  "));
  }
  function hasMultilineItems(maybeArray) {
    var _maybeArray$some;
    return (_maybeArray$some = maybeArray === null || maybeArray === void 0 ? void 0 : maybeArray.some((str) => str.includes("\n"))) !== null && _maybeArray$some !== void 0 ? _maybeArray$some : false;
  }
  var __accessCheck = (obj, member, msg2) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg2);
  };
  var __privateGet = (obj, member, getter) => {
    __accessCheck(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
  };
  var __privateAdd = (obj, member, value2) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value2);
  };
  var __privateSet = (obj, member, value2, setter) => {
    __accessCheck(obj, member, "write to private field");
    setter ? setter.call(obj, value2) : member.set(obj, value2);
    return value2;
  };
  var _url, _queries, _headers, _fetch;
  class SuiGraphQLRequestError extends Error {
  }
  class SuiGraphQLClient {
    constructor({
      url,
      fetch: fetchFn = fetch,
      headers = {},
      queries = {}
    }) {
      __privateAdd(this, _url, void 0);
      __privateAdd(this, _queries, void 0);
      __privateAdd(this, _headers, void 0);
      __privateAdd(this, _fetch, void 0);
      __privateSet(this, _url, url);
      __privateSet(this, _queries, queries);
      __privateSet(this, _headers, headers);
      __privateSet(this, _fetch, (...args) => fetchFn(...args));
    }
    async query(options) {
      const res = await __privateGet(this, _fetch).call(this, __privateGet(this, _url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...__privateGet(this, _headers)
        },
        body: JSON.stringify({
          query: typeof options.query === "string" ? String(options.query) : print(options.query),
          variables: options.variables,
          extensions: options.extensions,
          operationName: options.operationName
        })
      });
      if (!res.ok) {
        throw new SuiGraphQLRequestError(`GraphQL request failed: ${res.statusText} (${res.status})`);
      }
      return await res.json();
    }
    async execute(query, options) {
      return this.query({
        ...options,
        query: __privateGet(this, _queries)[query]
      });
    }
  }
  _url = /* @__PURE__ */ new WeakMap();
  _queries = /* @__PURE__ */ new WeakMap();
  _headers = /* @__PURE__ */ new WeakMap();
  _fetch = /* @__PURE__ */ new WeakMap();
  function forceBindThis(obj, exclude) {
    return new Proxy(obj, {
      get(target, p, receiver) {
        if (exclude && exclude.includes(p)) {
          return void 0;
        }
        let prop = Reflect.get(target, p, receiver);
        if (typeof prop === "function") {
          return (...arg) => prop.apply(target, arg);
        }
        return prop;
      }
    });
  }
  const _sfc_main$1 = /* @__PURE__ */ vue.defineComponent({
    __name: "SuiueProvider",
    props: {
      config: {
        type: Object,
        default: () => ({}),
        validator(config) {
          if (typeof config !== "object") {
            throw new Error("suiue provider config must be an object");
          }
          return true;
        }
      },
      state: {
        type: Object
      },
      query: {
        type: Object
      },
      actions: {
        type: Object
      }
    },
    emits: ["update:state", "update:query", "update:actions"],
    setup(__props, { emit: __emit }) {
      const props = __props;
      function buildConfig(config2) {
        if (!config2.id) {
          config2.id = "suiue-default-provider";
        }
        if (!config2.autoConnect) {
          config2.autoConnect = "disable";
        }
        if (!config2.network) {
          config2.network = "mainnet";
        }
        if (!config2.suiClientQL) {
          config2.suiClientQL = new SuiGraphQLClient({ url: `https://sui-${config2.network}.mystenlabs.com/` });
        }
        if (!config2.suiClient) {
          config2.suiClient = new SuiClient({ url: getFullnodeUrl(config2.network) });
        }
        if (!config2.preferredWallets) {
          config2.preferredWallets = [];
        }
        if (!config2.requiredFeatures) {
          config2.requiredFeatures = ["standard:connect", "sui:signAndExecuteTransactionBlock", "standard:events"];
        }
        if (!("standard:connect" in config2.requiredFeatures)) {
          config2.requiredFeatures.push("standard:connect");
        }
        if (!("standard:events" in config2.requiredFeatures)) {
          config2.requiredFeatures.push("standard:events");
        }
        if (!config2.walletFilter) {
          config2.walletFilter = () => true;
        }
        if (!config2.queryRetry) {
          config2.queryRetry = 5;
        }
        if (!config2.queryRetryIntervalMs) {
          config2.queryRetryIntervalMs = 5e3;
        }
        return config2;
      }
      const emit = __emit;
      const config = buildConfig(props.config);
      if (useProvider("PROVIDERS").includes(config.id)) {
        throw new ProviderAlreadyExistsError();
      }
      const walletState = forceBindThis(new WalletState(config));
      const walletQuery = forceBindThis(new WalletQuery(config, walletState));
      const walletActions = forceBindThis(new WalletActions(config, walletQuery, walletState));
      setProvider("PROVIDER", config.id);
      setProvider("PROVIDER_CONFIG", config);
      setProvider("WALLET_STATE", walletState);
      setProvider("WALLET_QUERY", walletQuery);
      setProvider("WALLET_ACTIONS", walletActions);
      emit("update:state", walletState);
      emit("update:query", walletQuery);
      emit("update:actions", walletActions);
      vue.onMounted(() => {
        const autoConnectCmp = vue.computed(async () => {
          if (props.config.autoConnect === "disable" || walletState.wallets.value.length === 0) {
            return;
          }
          const connectionInfo = getWalletConnectionInfo();
          async function connectLast() {
            let wallet = walletState.wallets.value.find((wallet2) => getWalletIdentifier(wallet2) === connectionInfo.wallet_ident);
            wallet && await walletState.connect(wallet, connectionInfo.account_addr);
          }
          if (connectionInfo) {
            if (props.config.autoConnect === "last" || props.config.autoConnect === "enable") {
              await connectLast();
            }
          } else {
            if (props.config.autoConnect === "enable") {
              await walletState.connect(walletState.wallets.value[0]);
            }
          }
        });
        if (autoConnectCmp.effect){
          autoConnectCmp.effect.run();
        }
      });
      return (_ctx, _cache) => {
        return vue.renderSlot(_ctx.$slots, "default");
      };
    }
  });
  let onceCbs = [];
  const paramsMap = /* @__PURE__ */ new WeakMap();
  function flushOnceCallbacks() {
    onceCbs.forEach((cb) => cb(...paramsMap.get(cb)));
    onceCbs = [];
  }
  function beforeNextFrameOnce(cb, ...params) {
    paramsMap.set(cb, params);
    if (onceCbs.includes(cb))
      return;
    onceCbs.push(cb) === 1 && requestAnimationFrame(flushOnceCallbacks);
  }
  function getPreciseEventTarget(event) {
    return event.composedPath()[0] || null;
  }
  function parseResponsiveProp(reponsiveProp) {
    if (typeof reponsiveProp === "number") {
      return {
        "": reponsiveProp.toString()
      };
    }
    const params = {};
    reponsiveProp.split(/ +/).forEach((pairLiteral) => {
      if (pairLiteral === "")
        return;
      const [prefix2, value2] = pairLiteral.split(":");
      if (value2 === void 0) {
        params[""] = prefix2;
      } else {
        params[prefix2] = value2;
      }
    });
    return params;
  }
  function parseResponsivePropValue(reponsiveProp, activeKeyOrSize) {
    var _a;
    if (reponsiveProp === void 0 || reponsiveProp === null)
      return void 0;
    const classObj = parseResponsiveProp(reponsiveProp);
    if (activeKeyOrSize === void 0)
      return classObj[""];
    if (typeof activeKeyOrSize === "string") {
      return (_a = classObj[activeKeyOrSize]) !== null && _a !== void 0 ? _a : classObj[""];
    } else if (Array.isArray(activeKeyOrSize)) {
      for (let i2 = activeKeyOrSize.length - 1; i2 >= 0; --i2) {
        const key = activeKeyOrSize[i2];
        if (key in classObj)
          return classObj[key];
      }
      return classObj[""];
    } else {
      let activeValue = void 0;
      let activeKey = -1;
      Object.keys(classObj).forEach((key) => {
        const keyAsNum = Number(key);
        if (!Number.isNaN(keyAsNum) && activeKeyOrSize >= keyAsNum && keyAsNum >= activeKey) {
          activeKey = keyAsNum;
          activeValue = classObj[key];
        }
      });
      return activeValue;
    }
  }
  function depx(value2) {
    if (typeof value2 === "string") {
      if (value2.endsWith("px")) {
        return Number(value2.slice(0, value2.length - 2));
      }
      return Number(value2);
    }
    return value2;
  }
  function pxfy(value2) {
    if (value2 === void 0 || value2 === null)
      return void 0;
    if (typeof value2 === "number")
      return `${value2}px`;
    if (value2.endsWith("px"))
      return value2;
    return `${value2}px`;
  }
  function getMargin(value2, position) {
    const parts = value2.trim().split(/\s+/g);
    const margin = {
      top: parts[0]
    };
    switch (parts.length) {
      case 1:
        margin.right = parts[0];
        margin.bottom = parts[0];
        margin.left = parts[0];
        break;
      case 2:
        margin.right = parts[1];
        margin.left = parts[1];
        margin.bottom = parts[0];
        break;
      case 3:
        margin.right = parts[1];
        margin.bottom = parts[2];
        margin.left = parts[1];
        break;
      case 4:
        margin.right = parts[1];
        margin.bottom = parts[2];
        margin.left = parts[3];
        break;
      default:
        throw new Error("[seemly/getMargin]:" + value2 + " is not a valid value.");
    }
    if (position === void 0)
      return margin;
    return margin[position];
  }
  function getGap(value2, orient) {
    const [rowGap, colGap] = value2.split(" ");
    if (!orient)
      return {
        row: rowGap,
        col: colGap || rowGap
      };
    return orient === "row" ? rowGap : colGap;
  }
  const colors = {
    black: "#000",
    silver: "#C0C0C0",
    gray: "#808080",
    white: "#FFF",
    maroon: "#800000",
    red: "#F00",
    purple: "#800080",
    fuchsia: "#F0F",
    green: "#008000",
    lime: "#0F0",
    olive: "#808000",
    yellow: "#FF0",
    navy: "#000080",
    blue: "#00F",
    teal: "#008080",
    aqua: "#0FF",
    transparent: "#0000"
  };
  const prefix$1 = "^\\s*";
  const suffix = "\\s*$";
  const float = "\\s*((\\.\\d+)|(\\d+(\\.\\d*)?))\\s*";
  const hex = "([0-9A-Fa-f])";
  const dhex = "([0-9A-Fa-f]{2})";
  const rgbRegex = new RegExp(`${prefix$1}rgb\\s*\\(${float},${float},${float}\\)${suffix}`);
  const rgbaRegex = new RegExp(`${prefix$1}rgba\\s*\\(${float},${float},${float},${float}\\)${suffix}`);
  const sHexRegex = new RegExp(`${prefix$1}#${hex}${hex}${hex}${suffix}`);
  const hexRegex = new RegExp(`${prefix$1}#${dhex}${dhex}${dhex}${suffix}`);
  const sHexaRegex = new RegExp(`${prefix$1}#${hex}${hex}${hex}${hex}${suffix}`);
  const hexaRegex = new RegExp(`${prefix$1}#${dhex}${dhex}${dhex}${dhex}${suffix}`);
  function parseHex(value2) {
    return parseInt(value2, 16);
  }
  function rgba(color) {
    try {
      let i2;
      if (i2 = hexRegex.exec(color)) {
        return [parseHex(i2[1]), parseHex(i2[2]), parseHex(i2[3]), 1];
      } else if (i2 = rgbRegex.exec(color)) {
        return [roundChannel(i2[1]), roundChannel(i2[5]), roundChannel(i2[9]), 1];
      } else if (i2 = rgbaRegex.exec(color)) {
        return [
          roundChannel(i2[1]),
          roundChannel(i2[5]),
          roundChannel(i2[9]),
          roundAlpha(i2[13])
        ];
      } else if (i2 = sHexRegex.exec(color)) {
        return [
          parseHex(i2[1] + i2[1]),
          parseHex(i2[2] + i2[2]),
          parseHex(i2[3] + i2[3]),
          1
        ];
      } else if (i2 = hexaRegex.exec(color)) {
        return [
          parseHex(i2[1]),
          parseHex(i2[2]),
          parseHex(i2[3]),
          roundAlpha(parseHex(i2[4]) / 255)
        ];
      } else if (i2 = sHexaRegex.exec(color)) {
        return [
          parseHex(i2[1] + i2[1]),
          parseHex(i2[2] + i2[2]),
          parseHex(i2[3] + i2[3]),
          roundAlpha(parseHex(i2[4] + i2[4]) / 255)
        ];
      } else if (color in colors) {
        return rgba(colors[color]);
      }
      throw new Error(`[seemly/rgba]: Invalid color value ${color}.`);
    } catch (e2) {
      throw e2;
    }
  }
  function normalizeAlpha(alphaValue) {
    return alphaValue > 1 ? 1 : alphaValue < 0 ? 0 : alphaValue;
  }
  function stringifyRgba(r, g, b, a2) {
    return `rgba(${roundChannel(r)}, ${roundChannel(g)}, ${roundChannel(b)}, ${normalizeAlpha(a2)})`;
  }
  function compositeChannel(v1, a1, v2, a2, a3) {
    return roundChannel((v1 * a1 * (1 - a2) + v2 * a2) / a3);
  }
  function composite(background, overlay2) {
    if (!Array.isArray(background))
      background = rgba(background);
    if (!Array.isArray(overlay2))
      overlay2 = rgba(overlay2);
    const a1 = background[3];
    const a2 = overlay2[3];
    const alpha = roundAlpha(a1 + a2 - a1 * a2);
    return stringifyRgba(compositeChannel(background[0], a1, overlay2[0], a2, alpha), compositeChannel(background[1], a1, overlay2[1], a2, alpha), compositeChannel(background[2], a1, overlay2[2], a2, alpha), alpha);
  }
  function changeColor(base2, options) {
    const [r, g, b, a2 = 1] = Array.isArray(base2) ? base2 : rgba(base2);
    if (options.alpha) {
      return stringifyRgba(r, g, b, options.alpha);
    }
    return stringifyRgba(r, g, b, a2);
  }
  function scaleColor(base2, options) {
    const [r, g, b, a2 = 1] = Array.isArray(base2) ? base2 : rgba(base2);
    const { lightness = 1, alpha = 1 } = options;
    return toRgbaString([r * lightness, g * lightness, b * lightness, a2 * alpha]);
  }
  function roundAlpha(value2) {
    const v2 = Math.round(Number(value2) * 100) / 100;
    if (v2 > 1)
      return 1;
    if (v2 < 0)
      return 0;
    return v2;
  }
  function roundChannel(value2) {
    const v2 = Math.round(Number(value2));
    if (v2 > 255)
      return 255;
    if (v2 < 0)
      return 0;
    return v2;
  }
  function toRgbaString(base2) {
    const [r, g, b] = base2;
    if (3 in base2) {
      return `rgba(${roundChannel(r)}, ${roundChannel(g)}, ${roundChannel(b)}, ${roundAlpha(base2[3])})`;
    }
    return `rgba(${roundChannel(r)}, ${roundChannel(g)}, ${roundChannel(b)}, 1)`;
  }
  function createId(length = 8) {
    return Math.random().toString(16).slice(2, 2 + length);
  }
  function getSlot$1(instance, slotName = "default", fallback = []) {
    const slots = instance.$slots;
    const slot = slots[slotName];
    if (slot === void 0)
      return fallback;
    return slot();
  }
  function keep(object, keys = [], rest) {
    const keepedObject = {};
    keys.forEach((key) => {
      keepedObject[key] = object[key];
    });
    return Object.assign(keepedObject, rest);
  }
  function flatten(vNodes, filterCommentNode = true, result = []) {
    vNodes.forEach((vNode) => {
      if (vNode === null)
        return;
      if (typeof vNode !== "object") {
        if (typeof vNode === "string" || typeof vNode === "number") {
          result.push(vue.createTextVNode(String(vNode)));
        }
        return;
      }
      if (Array.isArray(vNode)) {
        flatten(vNode, filterCommentNode, result);
        return;
      }
      if (vNode.type === vue.Fragment) {
        if (vNode.children === null)
          return;
        if (Array.isArray(vNode.children)) {
          flatten(vNode.children, filterCommentNode, result);
        }
      } else {
        if (vNode.type === vue.Comment && filterCommentNode)
          return;
        result.push(vNode);
      }
    });
    return result;
  }
  function call(funcs, ...args) {
    if (Array.isArray(funcs)) {
      funcs.forEach((func) => call(func, ...args));
    } else
      return funcs(...args);
  }
  function keysOf(obj) {
    return Object.keys(obj);
  }
  const render$1 = (r, ...args) => {
    if (typeof r === "function") {
      return r(...args);
    } else if (typeof r === "string") {
      return vue.createTextVNode(r);
    } else if (typeof r === "number") {
      return vue.createTextVNode(String(r));
    } else {
      return null;
    }
  };
  const warnedMessages = /* @__PURE__ */ new Set();
  function warnOnce(location, message) {
    const mergedMessage = `[naive/${location}]: ${message}`;
    if (warnedMessages.has(mergedMessage))
      return;
    warnedMessages.add(mergedMessage);
    console.error(mergedMessage);
  }
  function warn$2(location, message) {
    console.error(`[naive/${location}]: ${message}`);
  }
  function throwError(location, message) {
    throw new Error(`[naive/${location}]: ${message}`);
  }
  function getFirstSlotVNode(slots, slotName = "default", props = void 0) {
    const slot = slots[slotName];
    if (!slot) {
      warn$2("getFirstSlotVNode", `slot[${slotName}] is empty`);
      return null;
    }
    const slotContent = flatten(slot(props));
    if (slotContent.length === 1) {
      return slotContent[0];
    } else {
      warn$2("getFirstSlotVNode", `slot[${slotName}] should have exactly one child`);
      return null;
    }
  }
  function createInjectionKey(key) {
    return key;
  }
  function ensureValidVNode(vnodes) {
    return vnodes.some((child) => {
      if (!vue.isVNode(child)) {
        return true;
      }
      if (child.type === vue.Comment) {
        return false;
      }
      if (child.type === vue.Fragment && !ensureValidVNode(child.children)) {
        return false;
      }
      return true;
    }) ? vnodes : null;
  }
  function resolveSlot(slot, fallback) {
    return slot && ensureValidVNode(slot()) || fallback();
  }
  function resolveWrappedSlot(slot, wrapper) {
    const children = slot && ensureValidVNode(slot());
    return wrapper(children || null);
  }
  function isSlotEmpty(slot) {
    return !(slot && ensureValidVNode(slot()));
  }
  function isNodeVShowFalse(vNode) {
    var _a;
    const showDir = (_a = vNode.dirs) === null || _a === void 0 ? void 0 : _a.find(({
      dir
    }) => dir === vue.vShow);
    return !!(showDir && showDir.value === false);
  }
  const Wrapper = vue.defineComponent({
    render() {
      var _a, _b;
      return (_b = (_a = this.$slots).default) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
  });
  function color2Class(color) {
    return color.replace(/#|\(|\)|,|\s|\./g, "_");
  }
  function ampCount(selector) {
    let cnt = 0;
    for (let i2 = 0; i2 < selector.length; ++i2) {
      if (selector[i2] === "&")
        ++cnt;
    }
    return cnt;
  }
  const separatorRegex = /\s*,(?![^(]*\))\s*/g;
  const extraSpaceRegex = /\s+/g;
  function resolveSelectorWithAmp(amp, selector) {
    const nextAmp = [];
    selector.split(separatorRegex).forEach((partialSelector) => {
      let round = ampCount(partialSelector);
      if (!round) {
        amp.forEach((partialAmp) => {
          nextAmp.push(
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            (partialAmp && partialAmp + " ") + partialSelector
          );
        });
        return;
      } else if (round === 1) {
        amp.forEach((partialAmp) => {
          nextAmp.push(partialSelector.replace("&", partialAmp));
        });
        return;
      }
      let partialNextAmp = [
        partialSelector
      ];
      while (round--) {
        const nextPartialNextAmp = [];
        partialNextAmp.forEach((selectorItr) => {
          amp.forEach((partialAmp) => {
            nextPartialNextAmp.push(selectorItr.replace("&", partialAmp));
          });
        });
        partialNextAmp = nextPartialNextAmp;
      }
      partialNextAmp.forEach((part) => nextAmp.push(part));
    });
    return nextAmp;
  }
  function resolveSelector(amp, selector) {
    const nextAmp = [];
    selector.split(separatorRegex).forEach((partialSelector) => {
      amp.forEach((partialAmp) => {
        nextAmp.push((partialAmp && partialAmp + " ") + partialSelector);
      });
    });
    return nextAmp;
  }
  function parseSelectorPath(selectorPaths) {
    let amp = [""];
    selectorPaths.forEach((selector) => {
      selector = selector && selector.trim();
      if (
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        !selector
      ) {
        return;
      }
      if (selector.includes("&")) {
        amp = resolveSelectorWithAmp(amp, selector);
      } else {
        amp = resolveSelector(amp, selector);
      }
    });
    return amp.join(", ").replace(extraSpaceRegex, " ");
  }
  function removeElement(el) {
    if (!el)
      return;
    const parentElement = el.parentElement;
    if (parentElement)
      parentElement.removeChild(el);
  }
  function queryElement(id) {
    return document.querySelector(`style[cssr-id="${id}"]`);
  }
  function createElement(id) {
    const el = document.createElement("style");
    el.setAttribute("cssr-id", id);
    return el;
  }
  function isMediaOrSupports(selector) {
    if (!selector)
      return false;
    return /^\s*@(s|m)/.test(selector);
  }
  const kebabRegex = /[A-Z]/g;
  function kebabCase(pattern) {
    return pattern.replace(kebabRegex, (match) => "-" + match.toLowerCase());
  }
  function unwrapProperty(prop, indent2 = "  ") {
    if (typeof prop === "object" && prop !== null) {
      return " {\n" + Object.entries(prop).map((v2) => {
        return indent2 + `  ${kebabCase(v2[0])}: ${v2[1]};`;
      }).join("\n") + "\n" + indent2 + "}";
    }
    return `: ${prop};`;
  }
  function unwrapProperties(props, instance, params) {
    if (typeof props === "function") {
      return props({
        context: instance.context,
        props: params
      });
    }
    return props;
  }
  function createStyle(selector, props, instance, params) {
    if (!props)
      return "";
    const unwrappedProps = unwrapProperties(props, instance, params);
    if (!unwrappedProps)
      return "";
    if (typeof unwrappedProps === "string") {
      return `${selector} {
${unwrappedProps}
}`;
    }
    const propertyNames = Object.keys(unwrappedProps);
    if (propertyNames.length === 0) {
      if (instance.config.keepEmptyBlock)
        return selector + " {\n}";
      return "";
    }
    const statements = selector ? [
      selector + " {"
    ] : [];
    propertyNames.forEach((propertyName) => {
      const property = unwrappedProps[propertyName];
      if (propertyName === "raw") {
        statements.push("\n" + property + "\n");
        return;
      }
      propertyName = kebabCase(propertyName);
      if (property !== null && property !== void 0) {
        statements.push(`  ${propertyName}${unwrapProperty(property)}`);
      }
    });
    if (selector) {
      statements.push("}");
    }
    return statements.join("\n");
  }
  function loopCNodeListWithCallback(children, options, callback) {
    if (!children)
      return;
    children.forEach((child) => {
      if (Array.isArray(child)) {
        loopCNodeListWithCallback(child, options, callback);
      } else if (typeof child === "function") {
        const grandChildren = child(options);
        if (Array.isArray(grandChildren)) {
          loopCNodeListWithCallback(grandChildren, options, callback);
        } else if (grandChildren) {
          callback(grandChildren);
        }
      } else if (child) {
        callback(child);
      }
    });
  }
  function traverseCNode(node, selectorPaths, styles, instance, params, styleSheet) {
    const $ = node.$;
    let blockSelector = "";
    if (!$ || typeof $ === "string") {
      if (isMediaOrSupports($)) {
        blockSelector = $;
      } else {
        selectorPaths.push($);
      }
    } else if (typeof $ === "function") {
      const selector2 = $({
        context: instance.context,
        props: params
      });
      if (isMediaOrSupports(selector2)) {
        blockSelector = selector2;
      } else {
        selectorPaths.push(selector2);
      }
    } else {
      if ($.before)
        $.before(instance.context);
      if (!$.$ || typeof $.$ === "string") {
        if (isMediaOrSupports($.$)) {
          blockSelector = $.$;
        } else {
          selectorPaths.push($.$);
        }
      } else if ($.$) {
        const selector2 = $.$({
          context: instance.context,
          props: params
        });
        if (isMediaOrSupports(selector2)) {
          blockSelector = selector2;
        } else {
          selectorPaths.push(selector2);
        }
      }
    }
    const selector = parseSelectorPath(selectorPaths);
    const style2 = createStyle(selector, node.props, instance, params);
    if (blockSelector) {
      styles.push(`${blockSelector} {`);
      if (styleSheet && style2) {
        styleSheet.insertRule(`${blockSelector} {
${style2}
}
`);
      }
    } else {
      if (styleSheet && style2) {
        styleSheet.insertRule(style2);
      }
      if (!styleSheet && style2.length)
        styles.push(style2);
    }
    if (node.children) {
      loopCNodeListWithCallback(node.children, {
        context: instance.context,
        props: params
      }, (childNode) => {
        if (typeof childNode === "string") {
          const style3 = createStyle(selector, { raw: childNode }, instance, params);
          if (styleSheet) {
            styleSheet.insertRule(style3);
          } else {
            styles.push(style3);
          }
        } else {
          traverseCNode(childNode, selectorPaths, styles, instance, params, styleSheet);
        }
      });
    }
    selectorPaths.pop();
    if (blockSelector) {
      styles.push("}");
    }
    if ($ && $.after)
      $.after(instance.context);
  }
  function render(node, instance, props, insertRule = false) {
    const styles = [];
    traverseCNode(node, [], styles, instance, props, insertRule ? node.instance.__styleSheet : void 0);
    if (insertRule)
      return "";
    return styles.join("\n\n");
  }
  function murmur2(str) {
    var h = 0;
    var k, i2 = 0, len = str.length;
    for (; len >= 4; ++i2, len -= 4) {
      k = str.charCodeAt(i2) & 255 | (str.charCodeAt(++i2) & 255) << 8 | (str.charCodeAt(++i2) & 255) << 16 | (str.charCodeAt(++i2) & 255) << 24;
      k = /* Math.imul(k, m): */
      (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16);
      k ^= /* k >>> r: */
      k >>> 24;
      h = /* Math.imul(k, m): */
      (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16) ^ /* Math.imul(h, m): */
      (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
    }
    switch (len) {
      case 3:
        h ^= (str.charCodeAt(i2 + 2) & 255) << 16;
      case 2:
        h ^= (str.charCodeAt(i2 + 1) & 255) << 8;
      case 1:
        h ^= str.charCodeAt(i2) & 255;
        h = /* Math.imul(h, m): */
        (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
    }
    h ^= h >>> 13;
    h = /* Math.imul(h, m): */
    (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
    return ((h ^ h >>> 15) >>> 0).toString(36);
  }
  if (typeof window !== "undefined") {
    window.__cssrContext = {};
  }
  function unmount(intance, node, id) {
    const { els } = node;
    if (id === void 0) {
      els.forEach(removeElement);
      node.els = [];
    } else {
      const target = queryElement(id);
      if (target && els.includes(target)) {
        removeElement(target);
        node.els = els.filter((el) => el !== target);
      }
    }
  }
  function addElementToList(els, target) {
    els.push(target);
  }
  function mount(instance, node, id, props, head, silent, force, anchorMetaName, ssrAdapter2) {
    if (silent && !ssrAdapter2) {
      if (id === void 0) {
        console.error("[css-render/mount]: `id` is required in `silent` mode.");
        return;
      }
      const cssrContext = window.__cssrContext;
      if (!cssrContext[id]) {
        cssrContext[id] = true;
        render(node, instance, props, silent);
      }
      return;
    }
    let style2;
    if (id === void 0) {
      style2 = node.render(props);
      id = murmur2(style2);
    }
    if (ssrAdapter2) {
      ssrAdapter2.adapter(id, style2 !== null && style2 !== void 0 ? style2 : node.render(props));
      return;
    }
    const queriedTarget = queryElement(id);
    if (queriedTarget !== null && !force) {
      return queriedTarget;
    }
    const target = queriedTarget !== null && queriedTarget !== void 0 ? queriedTarget : createElement(id);
    if (style2 === void 0)
      style2 = node.render(props);
    target.textContent = style2;
    if (queriedTarget !== null)
      return queriedTarget;
    if (anchorMetaName) {
      const anchorMetaEl = document.head.querySelector(`meta[name="${anchorMetaName}"]`);
      if (anchorMetaEl) {
        document.head.insertBefore(target, anchorMetaEl);
        addElementToList(node.els, target);
        return target;
      }
    }
    if (head) {
      document.head.insertBefore(target, document.head.querySelector("style, link"));
    } else {
      document.head.appendChild(target);
    }
    addElementToList(node.els, target);
    return target;
  }
  function wrappedRender(props) {
    return render(this, this.instance, props);
  }
  function wrappedMount(options = {}) {
    const { id, ssr, props, head = false, silent = false, force = false, anchorMetaName } = options;
    const targetElement = mount(this.instance, this, id, props, head, silent, force, anchorMetaName, ssr);
    return targetElement;
  }
  function wrappedUnmount(options = {}) {
    const { id } = options;
    unmount(this.instance, this, id);
  }
  const createCNode = function(instance, $, props, children) {
    return {
      instance,
      $,
      props,
      children,
      els: [],
      render: wrappedRender,
      mount: wrappedMount,
      unmount: wrappedUnmount
    };
  };
  const c$1 = function(instance, $, props, children) {
    if (Array.isArray($)) {
      return createCNode(instance, { $: null }, null, $);
    } else if (Array.isArray(props)) {
      return createCNode(instance, $, null, props);
    } else if (Array.isArray(children)) {
      return createCNode(instance, $, props, children);
    } else {
      return createCNode(instance, $, props, null);
    }
  };
  function CssRender(config = {}) {
    let styleSheet = null;
    const cssr2 = {
      c: (...args) => c$1(cssr2, ...args),
      use: (plugin2, ...args) => plugin2.install(cssr2, ...args),
      find: queryElement,
      context: {},
      config,
      get __styleSheet() {
        if (!styleSheet) {
          const style2 = document.createElement("style");
          document.head.appendChild(style2);
          styleSheet = document.styleSheets[document.styleSheets.length - 1];
          return styleSheet;
        }
        return styleSheet;
      }
    };
    return cssr2;
  }
  function exists(id, ssr) {
    if (id === void 0)
      return false;
    if (ssr) {
      const { context: { ids } } = ssr;
      return ids.has(id);
    }
    return queryElement(id) !== null;
  }
  function plugin$1(options) {
    let _bPrefix = ".";
    let _ePrefix = "__";
    let _mPrefix = "--";
    let c2;
    if (options) {
      let t2 = options.blockPrefix;
      if (t2) {
        _bPrefix = t2;
      }
      t2 = options.elementPrefix;
      if (t2) {
        _ePrefix = t2;
      }
      t2 = options.modifierPrefix;
      if (t2) {
        _mPrefix = t2;
      }
    }
    const _plugin = {
      install(instance) {
        c2 = instance.c;
        const ctx2 = instance.context;
        ctx2.bem = {};
        ctx2.bem.b = null;
        ctx2.bem.els = null;
      }
    };
    function b(arg) {
      let memorizedB;
      let memorizedE;
      return {
        before(ctx2) {
          memorizedB = ctx2.bem.b;
          memorizedE = ctx2.bem.els;
          ctx2.bem.els = null;
        },
        after(ctx2) {
          ctx2.bem.b = memorizedB;
          ctx2.bem.els = memorizedE;
        },
        $({ context, props }) {
          arg = typeof arg === "string" ? arg : arg({ context, props });
          context.bem.b = arg;
          return `${(props === null || props === void 0 ? void 0 : props.bPrefix) || _bPrefix}${context.bem.b}`;
        }
      };
    }
    function e2(arg) {
      let memorizedE;
      return {
        before(ctx2) {
          memorizedE = ctx2.bem.els;
        },
        after(ctx2) {
          ctx2.bem.els = memorizedE;
        },
        $({ context, props }) {
          arg = typeof arg === "string" ? arg : arg({ context, props });
          context.bem.els = arg.split(",").map((v2) => v2.trim());
          return context.bem.els.map((el) => `${(props === null || props === void 0 ? void 0 : props.bPrefix) || _bPrefix}${context.bem.b}${_ePrefix}${el}`).join(", ");
        }
      };
    }
    function m(arg) {
      return {
        $({ context, props }) {
          arg = typeof arg === "string" ? arg : arg({ context, props });
          const modifiers = arg.split(",").map((v2) => v2.trim());
          function elementToSelector(el) {
            return modifiers.map((modifier) => `&${(props === null || props === void 0 ? void 0 : props.bPrefix) || _bPrefix}${context.bem.b}${el !== void 0 ? `${_ePrefix}${el}` : ""}${_mPrefix}${modifier}`).join(", ");
          }
          const els = context.bem.els;
          if (els !== null) {
            if (process.env.NODE_ENV !== "production" && els.length >= 2) {
              throw Error(`[css-render/plugin-bem]: m(${arg}) is invalid, using modifier inside multiple elements is not allowed`);
            }
            return elementToSelector(els[0]);
          } else {
            return elementToSelector();
          }
        }
      };
    }
    function notM(arg) {
      return {
        $({ context, props }) {
          arg = typeof arg === "string" ? arg : arg({ context, props });
          const els = context.bem.els;
          if (process.env.NODE_ENV !== "production" && els !== null && els.length >= 2) {
            throw Error(`[css-render/plugin-bem]: notM(${arg}) is invalid, using modifier inside multiple elements is not allowed`);
          }
          return `&:not(${(props === null || props === void 0 ? void 0 : props.bPrefix) || _bPrefix}${context.bem.b}${els !== null && els.length > 0 ? `${_ePrefix}${els[0]}` : ""}${_mPrefix}${arg})`;
        }
      };
    }
    const cB2 = (...args) => c2(b(args[0]), args[1], args[2]);
    const cE2 = (...args) => c2(e2(args[0]), args[1], args[2]);
    const cM2 = (...args) => c2(m(args[0]), args[1], args[2]);
    const cNotM2 = (...args) => c2(notM(args[0]), args[1], args[2]);
    Object.assign(_plugin, {
      cB: cB2,
      cE: cE2,
      cM: cM2,
      cNotM: cNotM2
    });
    return _plugin;
  }
  const namespace = "n";
  const prefix = `.${namespace}-`;
  const elementPrefix = "__";
  const modifierPrefix = "--";
  const cssr = CssRender();
  const plugin = plugin$1({
    blockPrefix: prefix,
    elementPrefix,
    modifierPrefix
  });
  cssr.use(plugin);
  const {
    c,
    find
  } = cssr;
  const {
    cB,
    cE,
    cM,
    cNotM
  } = plugin;
  function insideModal(style2) {
    return c(({
      props: {
        bPrefix
      }
    }) => `${bPrefix || prefix}modal, ${bPrefix || prefix}drawer`, [style2]);
  }
  function insidePopover(style2) {
    return c(({
      props: {
        bPrefix
      }
    }) => `${bPrefix || prefix}popover`, [style2]);
  }
  function asModal(style2) {
    return c(({
      props: {
        bPrefix
      }
    }) => `&${bPrefix || prefix}modal`, style2);
  }
  function createKey(prefix2, suffix2) {
    return prefix2 + (suffix2 === "default" ? "" : suffix2.replace(/^[a-z]/, (startChar) => startChar.toUpperCase()));
  }
  const isBrowser$2 = typeof document !== "undefined" && typeof window !== "undefined";
  const eventSet = /* @__PURE__ */ new WeakSet();
  function eventEffectNotPerformed(event) {
    return !eventSet.has(event);
  }
  function useFalseUntilTruthy(originalRef) {
    const currentRef = vue.ref(!!originalRef.value);
    if (currentRef.value)
      return vue.readonly(currentRef);
    const stop = vue.watch(originalRef, (value2) => {
      if (value2) {
        currentRef.value = true;
        stop();
      }
    });
    return vue.readonly(currentRef);
  }
  function useMemo(getterOrOptions) {
    const computedValueRef = vue.computed(getterOrOptions);
    const valueRef = vue.ref(computedValueRef.value);
    vue.watch(computedValueRef, (value2) => {
      valueRef.value = value2;
    });
    if (typeof getterOrOptions === "function") {
      return valueRef;
    } else {
      return {
        __v_isRef: true,
        get value() {
          return valueRef.value;
        },
        set value(v2) {
          getterOrOptions.set(v2);
        }
      };
    }
  }
  function hasInstance() {
    return vue.getCurrentInstance() !== null;
  }
  const isBrowser$1 = typeof window !== "undefined";
  function getEventTarget(e2) {
    const path = e2.composedPath();
    return path[0];
  }
  const traps = {
    mousemoveoutside: /* @__PURE__ */ new WeakMap(),
    clickoutside: /* @__PURE__ */ new WeakMap()
  };
  function createTrapHandler(name, el, originalHandler) {
    if (name === "mousemoveoutside") {
      const moveHandler = (e2) => {
        if (el.contains(getEventTarget(e2)))
          return;
        originalHandler(e2);
      };
      return {
        mousemove: moveHandler,
        touchstart: moveHandler
      };
    } else if (name === "clickoutside") {
      let mouseDownOutside = false;
      const downHandler = (e2) => {
        mouseDownOutside = !el.contains(getEventTarget(e2));
      };
      const upHanlder = (e2) => {
        if (!mouseDownOutside)
          return;
        if (el.contains(getEventTarget(e2)))
          return;
        originalHandler(e2);
      };
      return {
        mousedown: downHandler,
        mouseup: upHanlder,
        touchstart: downHandler,
        touchend: upHanlder
      };
    }
    console.error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `[evtd/create-trap-handler]: name \`${name}\` is invalid. This could be a bug of evtd.`
    );
    return {};
  }
  function ensureTrapHandlers(name, el, handler) {
    const handlers = traps[name];
    let elHandlers = handlers.get(el);
    if (elHandlers === void 0) {
      handlers.set(el, elHandlers = /* @__PURE__ */ new WeakMap());
    }
    let trapHandler = elHandlers.get(handler);
    if (trapHandler === void 0) {
      elHandlers.set(handler, trapHandler = createTrapHandler(name, el, handler));
    }
    return trapHandler;
  }
  function trapOn(name, el, handler, options) {
    if (name === "mousemoveoutside" || name === "clickoutside") {
      const trapHandlers = ensureTrapHandlers(name, el, handler);
      Object.keys(trapHandlers).forEach((key) => {
        on(key, document, trapHandlers[key], options);
      });
      return true;
    }
    return false;
  }
  function trapOff(name, el, handler, options) {
    if (name === "mousemoveoutside" || name === "clickoutside") {
      const trapHandlers = ensureTrapHandlers(name, el, handler);
      Object.keys(trapHandlers).forEach((key) => {
        off(key, document, trapHandlers[key], options);
      });
      return true;
    }
    return false;
  }
  function createDelegate() {
    if (typeof window === "undefined") {
      return {
        on: () => {
        },
        off: () => {
        }
      };
    }
    const propagationStopped = /* @__PURE__ */ new WeakMap();
    const immediatePropagationStopped = /* @__PURE__ */ new WeakMap();
    function trackPropagation() {
      propagationStopped.set(this, true);
    }
    function trackImmediate() {
      propagationStopped.set(this, true);
      immediatePropagationStopped.set(this, true);
    }
    function spy(event, propName, fn) {
      const source = event[propName];
      event[propName] = function() {
        fn.apply(event, arguments);
        return source.apply(event, arguments);
      };
      return event;
    }
    function unspy(event, propName) {
      event[propName] = Event.prototype[propName];
    }
    const currentTargets = /* @__PURE__ */ new WeakMap();
    const currentTargetDescriptor = Object.getOwnPropertyDescriptor(Event.prototype, "currentTarget");
    function getCurrentTarget() {
      var _a;
      return (_a = currentTargets.get(this)) !== null && _a !== void 0 ? _a : null;
    }
    function defineCurrentTarget(event, getter) {
      if (currentTargetDescriptor === void 0)
        return;
      Object.defineProperty(event, "currentTarget", {
        configurable: true,
        enumerable: true,
        get: getter !== null && getter !== void 0 ? getter : currentTargetDescriptor.get
      });
    }
    const phaseToTypeToElToHandlers = {
      bubble: {},
      capture: {}
    };
    const typeToWindowEventHandlers = {};
    function createUnifiedHandler() {
      const delegeteHandler = function(e2) {
        const { type: type2, eventPhase, bubbles } = e2;
        const target = getEventTarget(e2);
        if (eventPhase === 2)
          return;
        const phase = eventPhase === 1 ? "capture" : "bubble";
        let cursor = target;
        const path = [];
        while (true) {
          if (cursor === null)
            cursor = window;
          path.push(cursor);
          if (cursor === window) {
            break;
          }
          cursor = cursor.parentNode || null;
        }
        const captureElToHandlers = phaseToTypeToElToHandlers.capture[type2];
        const bubbleElToHandlers = phaseToTypeToElToHandlers.bubble[type2];
        spy(e2, "stopPropagation", trackPropagation);
        spy(e2, "stopImmediatePropagation", trackImmediate);
        defineCurrentTarget(e2, getCurrentTarget);
        if (phase === "capture") {
          if (captureElToHandlers === void 0)
            return;
          for (let i2 = path.length - 1; i2 >= 0; --i2) {
            if (propagationStopped.has(e2))
              break;
            const target2 = path[i2];
            const handlers = captureElToHandlers.get(target2);
            if (handlers !== void 0) {
              currentTargets.set(e2, target2);
              for (const handler of handlers) {
                if (immediatePropagationStopped.has(e2))
                  break;
                handler(e2);
              }
            }
            if (i2 === 0 && !bubbles && bubbleElToHandlers !== void 0) {
              const bubbleHandlers = bubbleElToHandlers.get(target2);
              if (bubbleHandlers !== void 0) {
                for (const handler of bubbleHandlers) {
                  if (immediatePropagationStopped.has(e2))
                    break;
                  handler(e2);
                }
              }
            }
          }
        } else if (phase === "bubble") {
          if (bubbleElToHandlers === void 0)
            return;
          for (let i2 = 0; i2 < path.length; ++i2) {
            if (propagationStopped.has(e2))
              break;
            const target2 = path[i2];
            const handlers = bubbleElToHandlers.get(target2);
            if (handlers !== void 0) {
              currentTargets.set(e2, target2);
              for (const handler of handlers) {
                if (immediatePropagationStopped.has(e2))
                  break;
                handler(e2);
              }
            }
          }
        }
        unspy(e2, "stopPropagation");
        unspy(e2, "stopImmediatePropagation");
        defineCurrentTarget(e2);
      };
      delegeteHandler.displayName = "evtdUnifiedHandler";
      return delegeteHandler;
    }
    function createUnifiedWindowEventHandler() {
      const delegateHandler = function(e2) {
        const { type: type2, eventPhase } = e2;
        if (eventPhase !== 2)
          return;
        const handlers = typeToWindowEventHandlers[type2];
        if (handlers === void 0)
          return;
        handlers.forEach((handler) => handler(e2));
      };
      delegateHandler.displayName = "evtdUnifiedWindowEventHandler";
      return delegateHandler;
    }
    const unifiedHandler = createUnifiedHandler();
    const unfiendWindowEventHandler = createUnifiedWindowEventHandler();
    function ensureElToHandlers(phase, type2) {
      const phaseHandlers = phaseToTypeToElToHandlers[phase];
      if (phaseHandlers[type2] === void 0) {
        phaseHandlers[type2] = /* @__PURE__ */ new Map();
        window.addEventListener(type2, unifiedHandler, phase === "capture");
      }
      return phaseHandlers[type2];
    }
    function ensureWindowEventHandlers(type2) {
      const windowEventHandlers = typeToWindowEventHandlers[type2];
      if (windowEventHandlers === void 0) {
        typeToWindowEventHandlers[type2] = /* @__PURE__ */ new Set();
        window.addEventListener(type2, unfiendWindowEventHandler);
      }
      return typeToWindowEventHandlers[type2];
    }
    function ensureHandlers(elToHandlers, el) {
      let elHandlers = elToHandlers.get(el);
      if (elHandlers === void 0) {
        elToHandlers.set(el, elHandlers = /* @__PURE__ */ new Set());
      }
      return elHandlers;
    }
    function handlerExist(el, phase, type2, handler) {
      const elToHandlers = phaseToTypeToElToHandlers[phase][type2];
      if (elToHandlers !== void 0) {
        const handlers = elToHandlers.get(el);
        if (handlers !== void 0) {
          if (handlers.has(handler))
            return true;
        }
      }
      return false;
    }
    function windowEventHandlerExist(type2, handler) {
      const handlers = typeToWindowEventHandlers[type2];
      if (handlers !== void 0) {
        if (handlers.has(handler)) {
          return true;
        }
      }
      return false;
    }
    function on2(type2, el, handler, options) {
      let mergedHandler;
      if (typeof options === "object" && options.once === true) {
        mergedHandler = (e2) => {
          off2(type2, el, mergedHandler, options);
          handler(e2);
        };
      } else {
        mergedHandler = handler;
      }
      const trapped = trapOn(type2, el, mergedHandler, options);
      if (trapped)
        return;
      const phase = options === true || typeof options === "object" && options.capture === true ? "capture" : "bubble";
      const elToHandlers = ensureElToHandlers(phase, type2);
      const handlers = ensureHandlers(elToHandlers, el);
      if (!handlers.has(mergedHandler))
        handlers.add(mergedHandler);
      if (el === window) {
        const windowEventHandlers = ensureWindowEventHandlers(type2);
        if (!windowEventHandlers.has(mergedHandler)) {
          windowEventHandlers.add(mergedHandler);
        }
      }
    }
    function off2(type2, el, handler, options) {
      const trapped = trapOff(type2, el, handler, options);
      if (trapped)
        return;
      const capture = options === true || typeof options === "object" && options.capture === true;
      const phase = capture ? "capture" : "bubble";
      const elToHandlers = ensureElToHandlers(phase, type2);
      const handlers = ensureHandlers(elToHandlers, el);
      if (el === window) {
        const mirrorPhase = capture ? "bubble" : "capture";
        if (!handlerExist(el, mirrorPhase, type2, handler) && windowEventHandlerExist(type2, handler)) {
          const windowEventHandlers = typeToWindowEventHandlers[type2];
          windowEventHandlers.delete(handler);
          if (windowEventHandlers.size === 0) {
            window.removeEventListener(type2, unfiendWindowEventHandler);
            typeToWindowEventHandlers[type2] = void 0;
          }
        }
      }
      if (handlers.has(handler))
        handlers.delete(handler);
      if (handlers.size === 0) {
        elToHandlers.delete(el);
      }
      if (elToHandlers.size === 0) {
        window.removeEventListener(type2, unifiedHandler, phase === "capture");
        phaseToTypeToElToHandlers[phase][type2] = void 0;
      }
    }
    return {
      on: on2,
      off: off2
    };
  }
  const { on, off } = createDelegate();
  const mousePositionRef = vue.ref(null);
  function clickHandler(e2) {
    if (e2.clientX > 0 || e2.clientY > 0) {
      mousePositionRef.value = {
        x: e2.clientX,
        y: e2.clientY
      };
    } else {
      const { target } = e2;
      if (target instanceof Element) {
        const { left, top, width, height } = target.getBoundingClientRect();
        if (left > 0 || top > 0) {
          mousePositionRef.value = {
            x: left + width / 2,
            y: top + height / 2
          };
        } else {
          mousePositionRef.value = { x: 0, y: 0 };
        }
      } else {
        mousePositionRef.value = null;
      }
    }
  }
  let usedCount$1 = 0;
  let managable$1 = true;
  function useClickPosition() {
    if (!isBrowser$1)
      return vue.readonly(vue.ref(null));
    if (usedCount$1 === 0)
      on("click", document, clickHandler, true);
    const setup = () => {
      usedCount$1 += 1;
    };
    if (managable$1 && (managable$1 = hasInstance())) {
      vue.onBeforeMount(setup);
      vue.onBeforeUnmount(() => {
        usedCount$1 -= 1;
        if (usedCount$1 === 0)
          off("click", document, clickHandler, true);
      });
    } else {
      setup();
    }
    return vue.readonly(mousePositionRef);
  }
  const clickedTimeRef = vue.ref(void 0);
  let usedCount = 0;
  function handleClick() {
    clickedTimeRef.value = Date.now();
  }
  let managable = true;
  function useClicked(timeout) {
    if (!isBrowser$1)
      return vue.readonly(vue.ref(false));
    const clickedRef = vue.ref(false);
    let timerId = null;
    function clearTimer() {
      if (timerId !== null)
        window.clearTimeout(timerId);
    }
    function clickedHandler() {
      clearTimer();
      clickedRef.value = true;
      timerId = window.setTimeout(() => {
        clickedRef.value = false;
      }, timeout);
    }
    if (usedCount === 0) {
      on("click", window, handleClick, true);
    }
    const setup = () => {
      usedCount += 1;
      on("click", window, clickedHandler, true);
    };
    if (managable && (managable = hasInstance())) {
      vue.onBeforeMount(setup);
      vue.onBeforeUnmount(() => {
        usedCount -= 1;
        if (usedCount === 0) {
          off("click", window, handleClick, true);
        }
        off("click", window, clickedHandler, true);
        clearTimer();
      });
    } else {
      setup();
    }
    return vue.readonly(clickedRef);
  }
  function isMounted() {
    const isMounted2 = vue.ref(false);
    vue.onMounted(() => {
      isMounted2.value = true;
    });
    return vue.readonly(isMounted2);
  }
  function useCompitable(reactive, keys) {
    return vue.computed(() => {
      for (const key of keys) {
        if (reactive[key] !== void 0)
          return reactive[key];
      }
      return reactive[keys[keys.length - 1]];
    });
  }
  const isIos = (typeof window === "undefined" ? false : /iPad|iPhone|iPod/.test(navigator.platform) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) && // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  !window.MSStream;
  function useIsIos() {
    return isIos;
  }
  const defaultBreakpointOptions = {
    // mobile
    // 0 ~ 640 doesn't mean it should display well in all the range,
    // but means you should treat it like a mobile phone.)
    xs: 0,
    s: 640,
    m: 1024,
    l: 1280,
    xl: 1536,
    "2xl": 1920
    // normal desktop display
  };
  function createMediaQuery(screenWidth) {
    return `(min-width: ${screenWidth}px)`;
  }
  const mqlMap = {};
  function useBreakpoints(screens = defaultBreakpointOptions) {
    if (!isBrowser$1)
      return vue.computed(() => []);
    if (typeof window.matchMedia !== "function")
      return vue.computed(() => []);
    const breakpointStatusRef = vue.ref({});
    const breakpoints = Object.keys(screens);
    const updateBreakpoints = (e2, breakpointName) => {
      if (e2.matches)
        breakpointStatusRef.value[breakpointName] = true;
      else
        breakpointStatusRef.value[breakpointName] = false;
    };
    breakpoints.forEach((key) => {
      const breakpointValue = screens[key];
      let mql;
      let cbs;
      if (mqlMap[breakpointValue] === void 0) {
        mql = window.matchMedia(createMediaQuery(breakpointValue));
        if (mql.addEventListener) {
          mql.addEventListener("change", (e2) => {
            cbs.forEach((cb) => {
              cb(e2, key);
            });
          });
        } else if (mql.addListener) {
          mql.addListener((e2) => {
            cbs.forEach((cb) => {
              cb(e2, key);
            });
          });
        }
        cbs = /* @__PURE__ */ new Set();
        mqlMap[breakpointValue] = {
          mql,
          cbs
        };
      } else {
        mql = mqlMap[breakpointValue].mql;
        cbs = mqlMap[breakpointValue].cbs;
      }
      cbs.add(updateBreakpoints);
      if (mql.matches) {
        cbs.forEach((cb) => {
          cb(mql, key);
        });
      }
    });
    vue.onBeforeUnmount(() => {
      breakpoints.forEach((breakpoint) => {
        const { cbs } = mqlMap[screens[breakpoint]];
        if (cbs.has(updateBreakpoints)) {
          cbs.delete(updateBreakpoints);
        }
      });
    });
    return vue.computed(() => {
      const { value: value2 } = breakpointStatusRef;
      return breakpoints.filter((key) => value2[key]);
    });
  }
  const modalBodyInjectionKey = createInjectionKey("n-modal-body");
  const modalProviderInjectionKey = createInjectionKey("n-modal-provider");
  const modalInjectionKey = createInjectionKey("n-modal");
  const drawerBodyInjectionKey = createInjectionKey("n-drawer-body");
  const popoverBodyInjectionKey = createInjectionKey("n-popover-body");
  function getSlot(scope, slots, slotName = "default") {
    const slot = slots[slotName];
    if (slot === void 0) {
      throw new Error(`[vueuc/${scope}]: slot[${slotName}] is empty.`);
    }
    return slot();
  }
  const ctxKey = "@@coContext";
  const clickoutside = {
    mounted(el, { value: value2, modifiers }) {
      el[ctxKey] = {
        handler: void 0
      };
      if (typeof value2 === "function") {
        el[ctxKey].handler = value2;
        on("clickoutside", el, value2, {
          capture: modifiers.capture
        });
      }
    },
    updated(el, { value: value2, modifiers }) {
      const ctx2 = el[ctxKey];
      if (typeof value2 === "function") {
        if (ctx2.handler) {
          if (ctx2.handler !== value2) {
            off("clickoutside", el, ctx2.handler, {
              capture: modifiers.capture
            });
            ctx2.handler = value2;
            on("clickoutside", el, value2, {
              capture: modifiers.capture
            });
          }
        } else {
          el[ctxKey].handler = value2;
          on("clickoutside", el, value2, {
            capture: modifiers.capture
          });
        }
      } else {
        if (ctx2.handler) {
          off("clickoutside", el, ctx2.handler, {
            capture: modifiers.capture
          });
          ctx2.handler = void 0;
        }
      }
    },
    unmounted(el, { modifiers }) {
      const { handler } = el[ctxKey];
      if (handler) {
        off("clickoutside", el, handler, {
          capture: modifiers.capture
        });
      }
      el[ctxKey].handler = void 0;
    }
  };
  const clickoutside$1 = clickoutside;
  function warn$1(location, message) {
    console.error(`[vdirs/${location}]: ${message}`);
  }
  class ZIndexManager {
    constructor() {
      this.elementZIndex = /* @__PURE__ */ new Map();
      this.nextZIndex = 2e3;
    }
    get elementCount() {
      return this.elementZIndex.size;
    }
    ensureZIndex(el, zIndex) {
      const { elementZIndex } = this;
      if (zIndex !== void 0) {
        el.style.zIndex = `${zIndex}`;
        elementZIndex.delete(el);
        return;
      }
      const { nextZIndex } = this;
      if (elementZIndex.has(el)) {
        const currentZIndex = elementZIndex.get(el);
        if (currentZIndex + 1 === this.nextZIndex)
          return;
      }
      el.style.zIndex = `${nextZIndex}`;
      elementZIndex.set(el, nextZIndex);
      this.nextZIndex = nextZIndex + 1;
      this.squashState();
    }
    unregister(el, zIndex) {
      const { elementZIndex } = this;
      if (elementZIndex.has(el)) {
        elementZIndex.delete(el);
      } else if (zIndex === void 0) {
        warn$1("z-index-manager/unregister-element", "Element not found when unregistering.");
      }
      this.squashState();
    }
    squashState() {
      const { elementCount } = this;
      if (!elementCount) {
        this.nextZIndex = 2e3;
      }
      if (this.nextZIndex - elementCount > 2500)
        this.rearrange();
    }
    rearrange() {
      const elementZIndexPair = Array.from(this.elementZIndex.entries());
      elementZIndexPair.sort((pair1, pair2) => {
        return pair1[1] - pair2[1];
      });
      this.nextZIndex = 2e3;
      elementZIndexPair.forEach((pair) => {
        const el = pair[0];
        const zIndex = this.nextZIndex++;
        if (`${zIndex}` !== el.style.zIndex)
          el.style.zIndex = `${zIndex}`;
      });
    }
  }
  const zIndexManager = new ZIndexManager();
  const ctx = "@@ziContext";
  const zindexable = {
    mounted(el, bindings) {
      const { value: value2 = {} } = bindings;
      const { zIndex, enabled } = value2;
      el[ctx] = {
        enabled: !!enabled,
        initialized: false
      };
      if (enabled) {
        zIndexManager.ensureZIndex(el, zIndex);
        el[ctx].initialized = true;
      }
    },
    updated(el, bindings) {
      const { value: value2 = {} } = bindings;
      const { zIndex, enabled } = value2;
      const cachedEnabled = el[ctx].enabled;
      if (enabled && !cachedEnabled) {
        zIndexManager.ensureZIndex(el, zIndex);
        el[ctx].initialized = true;
      }
      el[ctx].enabled = !!enabled;
    },
    unmounted(el, bindings) {
      if (!el[ctx].initialized)
        return;
      const { value: value2 = {} } = bindings;
      const { zIndex } = value2;
      zIndexManager.unregister(el, zIndex);
    }
  };
  const zindexable$1 = zindexable;
  const ssrContextKey = "@css-render/vue3-ssr";
  function createStyleString(id, style2) {
    return `<style cssr-id="${id}">
${style2}
</style>`;
  }
  function ssrAdapter(id, style2, ssrContext) {
    const { styles, ids } = ssrContext;
    if (ids.has(id))
      return;
    if (styles !== null) {
      ids.add(id);
      styles.push(createStyleString(id, style2));
    }
  }
  const isBrowser = typeof document !== "undefined";
  function useSsrAdapter() {
    if (isBrowser)
      return void 0;
    const context = vue.inject(ssrContextKey, null);
    if (context === null)
      return void 0;
    return {
      adapter: (id, style2) => ssrAdapter(id, style2, context),
      context
    };
  }
  function warn(location, message) {
    console.error(`[vueuc/${location}]: ${message}`);
  }
  function resolveTo(selector) {
    if (typeof selector === "string") {
      return document.querySelector(selector);
    }
    return selector();
  }
  const LazyTeleport = vue.defineComponent({
    name: "LazyTeleport",
    props: {
      to: {
        type: [String, Object],
        default: void 0
      },
      disabled: Boolean,
      show: {
        type: Boolean,
        required: true
      }
    },
    setup(props) {
      return {
        showTeleport: useFalseUntilTruthy(vue.toRef(props, "show")),
        mergedTo: vue.computed(() => {
          const { to } = props;
          return to !== null && to !== void 0 ? to : "body";
        })
      };
    },
    render() {
      return this.showTeleport ? this.disabled ? getSlot("lazy-teleport", this.$slots) : vue.h(vue.Teleport, {
        disabled: this.disabled,
        to: this.mergedTo
      }, getSlot("lazy-teleport", this.$slots)) : null;
    }
  });
  var resizeObservers = [];
  var hasActiveObservations = function() {
    return resizeObservers.some(function(ro) {
      return ro.activeTargets.length > 0;
    });
  };
  var hasSkippedObservations = function() {
    return resizeObservers.some(function(ro) {
      return ro.skippedTargets.length > 0;
    });
  };
  var msg = "ResizeObserver loop completed with undelivered notifications.";
  var deliverResizeLoopError = function() {
    var event;
    if (typeof ErrorEvent === "function") {
      event = new ErrorEvent("error", {
        message: msg
      });
    } else {
      event = document.createEvent("Event");
      event.initEvent("error", false, false);
      event.message = msg;
    }
    window.dispatchEvent(event);
  };
  var ResizeObserverBoxOptions;
  (function(ResizeObserverBoxOptions2) {
    ResizeObserverBoxOptions2["BORDER_BOX"] = "border-box";
    ResizeObserverBoxOptions2["CONTENT_BOX"] = "content-box";
    ResizeObserverBoxOptions2["DEVICE_PIXEL_CONTENT_BOX"] = "device-pixel-content-box";
  })(ResizeObserverBoxOptions || (ResizeObserverBoxOptions = {}));
  var freeze = function(obj) {
    return Object.freeze(obj);
  };
  var ResizeObserverSize = /* @__PURE__ */ function() {
    function ResizeObserverSize2(inlineSize, blockSize) {
      this.inlineSize = inlineSize;
      this.blockSize = blockSize;
      freeze(this);
    }
    return ResizeObserverSize2;
  }();
  var DOMRectReadOnly = function() {
    function DOMRectReadOnly2(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.top = this.y;
      this.left = this.x;
      this.bottom = this.top + this.height;
      this.right = this.left + this.width;
      return freeze(this);
    }
    DOMRectReadOnly2.prototype.toJSON = function() {
      var _a = this, x = _a.x, y = _a.y, top = _a.top, right = _a.right, bottom = _a.bottom, left = _a.left, width = _a.width, height = _a.height;
      return { x, y, top, right, bottom, left, width, height };
    };
    DOMRectReadOnly2.fromRect = function(rectangle) {
      return new DOMRectReadOnly2(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    };
    return DOMRectReadOnly2;
  }();
  var isSVG = function(target) {
    return target instanceof SVGElement && "getBBox" in target;
  };
  var isHidden = function(target) {
    if (isSVG(target)) {
      var _a = target.getBBox(), width = _a.width, height = _a.height;
      return !width && !height;
    }
    var _b = target, offsetWidth = _b.offsetWidth, offsetHeight = _b.offsetHeight;
    return !(offsetWidth || offsetHeight || target.getClientRects().length);
  };
  var isElement = function(obj) {
    var _a;
    if (obj instanceof Element) {
      return true;
    }
    var scope = (_a = obj === null || obj === void 0 ? void 0 : obj.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView;
    return !!(scope && obj instanceof scope.Element);
  };
  var isReplacedElement = function(target) {
    switch (target.tagName) {
      case "INPUT":
        if (target.type !== "image") {
          break;
        }
      case "VIDEO":
      case "AUDIO":
      case "EMBED":
      case "OBJECT":
      case "CANVAS":
      case "IFRAME":
      case "IMG":
        return true;
    }
    return false;
  };
  var global$1 = typeof window !== "undefined" ? window : {};
  var cache = /* @__PURE__ */ new WeakMap();
  var scrollRegexp = /auto|scroll/;
  var verticalRegexp = /^tb|vertical/;
  var IE = /msie|trident/i.test(global$1.navigator && global$1.navigator.userAgent);
  var parseDimension = function(pixel) {
    return parseFloat(pixel || "0");
  };
  var size = function(inlineSize, blockSize, switchSizes) {
    if (inlineSize === void 0) {
      inlineSize = 0;
    }
    if (blockSize === void 0) {
      blockSize = 0;
    }
    if (switchSizes === void 0) {
      switchSizes = false;
    }
    return new ResizeObserverSize((switchSizes ? blockSize : inlineSize) || 0, (switchSizes ? inlineSize : blockSize) || 0);
  };
  var zeroBoxes = freeze({
    devicePixelContentBoxSize: size(),
    borderBoxSize: size(),
    contentBoxSize: size(),
    contentRect: new DOMRectReadOnly(0, 0, 0, 0)
  });
  var calculateBoxSizes = function(target, forceRecalculation) {
    if (forceRecalculation === void 0) {
      forceRecalculation = false;
    }
    if (cache.has(target) && !forceRecalculation) {
      return cache.get(target);
    }
    if (isHidden(target)) {
      cache.set(target, zeroBoxes);
      return zeroBoxes;
    }
    var cs = getComputedStyle(target);
    var svg = isSVG(target) && target.ownerSVGElement && target.getBBox();
    var removePadding = !IE && cs.boxSizing === "border-box";
    var switchSizes = verticalRegexp.test(cs.writingMode || "");
    var canScrollVertically = !svg && scrollRegexp.test(cs.overflowY || "");
    var canScrollHorizontally = !svg && scrollRegexp.test(cs.overflowX || "");
    var paddingTop = svg ? 0 : parseDimension(cs.paddingTop);
    var paddingRight = svg ? 0 : parseDimension(cs.paddingRight);
    var paddingBottom = svg ? 0 : parseDimension(cs.paddingBottom);
    var paddingLeft = svg ? 0 : parseDimension(cs.paddingLeft);
    var borderTop = svg ? 0 : parseDimension(cs.borderTopWidth);
    var borderRight = svg ? 0 : parseDimension(cs.borderRightWidth);
    var borderBottom = svg ? 0 : parseDimension(cs.borderBottomWidth);
    var borderLeft = svg ? 0 : parseDimension(cs.borderLeftWidth);
    var horizontalPadding = paddingLeft + paddingRight;
    var verticalPadding = paddingTop + paddingBottom;
    var horizontalBorderArea = borderLeft + borderRight;
    var verticalBorderArea = borderTop + borderBottom;
    var horizontalScrollbarThickness = !canScrollHorizontally ? 0 : target.offsetHeight - verticalBorderArea - target.clientHeight;
    var verticalScrollbarThickness = !canScrollVertically ? 0 : target.offsetWidth - horizontalBorderArea - target.clientWidth;
    var widthReduction = removePadding ? horizontalPadding + horizontalBorderArea : 0;
    var heightReduction = removePadding ? verticalPadding + verticalBorderArea : 0;
    var contentWidth = svg ? svg.width : parseDimension(cs.width) - widthReduction - verticalScrollbarThickness;
    var contentHeight = svg ? svg.height : parseDimension(cs.height) - heightReduction - horizontalScrollbarThickness;
    var borderBoxWidth = contentWidth + horizontalPadding + verticalScrollbarThickness + horizontalBorderArea;
    var borderBoxHeight = contentHeight + verticalPadding + horizontalScrollbarThickness + verticalBorderArea;
    var boxes = freeze({
      devicePixelContentBoxSize: size(Math.round(contentWidth * devicePixelRatio), Math.round(contentHeight * devicePixelRatio), switchSizes),
      borderBoxSize: size(borderBoxWidth, borderBoxHeight, switchSizes),
      contentBoxSize: size(contentWidth, contentHeight, switchSizes),
      contentRect: new DOMRectReadOnly(paddingLeft, paddingTop, contentWidth, contentHeight)
    });
    cache.set(target, boxes);
    return boxes;
  };
  var calculateBoxSize = function(target, observedBox, forceRecalculation) {
    var _a = calculateBoxSizes(target, forceRecalculation), borderBoxSize = _a.borderBoxSize, contentBoxSize = _a.contentBoxSize, devicePixelContentBoxSize = _a.devicePixelContentBoxSize;
    switch (observedBox) {
      case ResizeObserverBoxOptions.DEVICE_PIXEL_CONTENT_BOX:
        return devicePixelContentBoxSize;
      case ResizeObserverBoxOptions.BORDER_BOX:
        return borderBoxSize;
      default:
        return contentBoxSize;
    }
  };
  var ResizeObserverEntry = /* @__PURE__ */ function() {
    function ResizeObserverEntry2(target) {
      var boxes = calculateBoxSizes(target);
      this.target = target;
      this.contentRect = boxes.contentRect;
      this.borderBoxSize = freeze([boxes.borderBoxSize]);
      this.contentBoxSize = freeze([boxes.contentBoxSize]);
      this.devicePixelContentBoxSize = freeze([boxes.devicePixelContentBoxSize]);
    }
    return ResizeObserverEntry2;
  }();
  var calculateDepthForNode = function(node) {
    if (isHidden(node)) {
      return Infinity;
    }
    var depth = 0;
    var parent = node.parentNode;
    while (parent) {
      depth += 1;
      parent = parent.parentNode;
    }
    return depth;
  };
  var broadcastActiveObservations = function() {
    var shallowestDepth = Infinity;
    var callbacks2 = [];
    resizeObservers.forEach(function processObserver(ro) {
      if (ro.activeTargets.length === 0) {
        return;
      }
      var entries = [];
      ro.activeTargets.forEach(function processTarget(ot) {
        var entry = new ResizeObserverEntry(ot.target);
        var targetDepth = calculateDepthForNode(ot.target);
        entries.push(entry);
        ot.lastReportedSize = calculateBoxSize(ot.target, ot.observedBox);
        if (targetDepth < shallowestDepth) {
          shallowestDepth = targetDepth;
        }
      });
      callbacks2.push(function resizeObserverCallback() {
        ro.callback.call(ro.observer, entries, ro.observer);
      });
      ro.activeTargets.splice(0, ro.activeTargets.length);
    });
    for (var _i = 0, callbacks_1 = callbacks2; _i < callbacks_1.length; _i++) {
      var callback = callbacks_1[_i];
      callback();
    }
    return shallowestDepth;
  };
  var gatherActiveObservationsAtDepth = function(depth) {
    resizeObservers.forEach(function processObserver(ro) {
      ro.activeTargets.splice(0, ro.activeTargets.length);
      ro.skippedTargets.splice(0, ro.skippedTargets.length);
      ro.observationTargets.forEach(function processTarget(ot) {
        if (ot.isActive()) {
          if (calculateDepthForNode(ot.target) > depth) {
            ro.activeTargets.push(ot);
          } else {
            ro.skippedTargets.push(ot);
          }
        }
      });
    });
  };
  var process$1 = function() {
    var depth = 0;
    gatherActiveObservationsAtDepth(depth);
    while (hasActiveObservations()) {
      depth = broadcastActiveObservations();
      gatherActiveObservationsAtDepth(depth);
    }
    if (hasSkippedObservations()) {
      deliverResizeLoopError();
    }
    return depth > 0;
  };
  var trigger;
  var callbacks = [];
  var notify = function() {
    return callbacks.splice(0).forEach(function(cb) {
      return cb();
    });
  };
  var queueMicroTask = function(callback) {
    if (!trigger) {
      var toggle_1 = 0;
      var el_1 = document.createTextNode("");
      var config = { characterData: true };
      new MutationObserver(function() {
        return notify();
      }).observe(el_1, config);
      trigger = function() {
        el_1.textContent = "".concat(toggle_1 ? toggle_1-- : toggle_1++);
      };
    }
    callbacks.push(callback);
    trigger();
  };
  var queueResizeObserver = function(cb) {
    queueMicroTask(function ResizeObserver2() {
      requestAnimationFrame(cb);
    });
  };
  var watching = 0;
  var isWatching = function() {
    return !!watching;
  };
  var CATCH_PERIOD = 250;
  var observerConfig = { attributes: true, characterData: true, childList: true, subtree: true };
  var events = [
    "resize",
    "load",
    "transitionend",
    "animationend",
    "animationstart",
    "animationiteration",
    "keyup",
    "keydown",
    "mouseup",
    "mousedown",
    "mouseover",
    "mouseout",
    "blur",
    "focus"
  ];
  var time = function(timeout) {
    if (timeout === void 0) {
      timeout = 0;
    }
    return Date.now() + timeout;
  };
  var scheduled = false;
  var Scheduler = function() {
    function Scheduler2() {
      var _this = this;
      this.stopped = true;
      this.listener = function() {
        return _this.schedule();
      };
    }
    Scheduler2.prototype.run = function(timeout) {
      var _this = this;
      if (timeout === void 0) {
        timeout = CATCH_PERIOD;
      }
      if (scheduled) {
        return;
      }
      scheduled = true;
      var until = time(timeout);
      queueResizeObserver(function() {
        var elementsHaveResized = false;
        try {
          elementsHaveResized = process$1();
        } finally {
          scheduled = false;
          timeout = until - time();
          if (!isWatching()) {
            return;
          }
          if (elementsHaveResized) {
            _this.run(1e3);
          } else if (timeout > 0) {
            _this.run(timeout);
          } else {
            _this.start();
          }
        }
      });
    };
    Scheduler2.prototype.schedule = function() {
      this.stop();
      this.run();
    };
    Scheduler2.prototype.observe = function() {
      var _this = this;
      var cb = function() {
        return _this.observer && _this.observer.observe(document.body, observerConfig);
      };
      document.body ? cb() : global$1.addEventListener("DOMContentLoaded", cb);
    };
    Scheduler2.prototype.start = function() {
      var _this = this;
      if (this.stopped) {
        this.stopped = false;
        this.observer = new MutationObserver(this.listener);
        this.observe();
        events.forEach(function(name) {
          return global$1.addEventListener(name, _this.listener, true);
        });
      }
    };
    Scheduler2.prototype.stop = function() {
      var _this = this;
      if (!this.stopped) {
        this.observer && this.observer.disconnect();
        events.forEach(function(name) {
          return global$1.removeEventListener(name, _this.listener, true);
        });
        this.stopped = true;
      }
    };
    return Scheduler2;
  }();
  var scheduler = new Scheduler();
  var updateCount = function(n2) {
    !watching && n2 > 0 && scheduler.start();
    watching += n2;
    !watching && scheduler.stop();
  };
  var skipNotifyOnElement = function(target) {
    return !isSVG(target) && !isReplacedElement(target) && getComputedStyle(target).display === "inline";
  };
  var ResizeObservation = function() {
    function ResizeObservation2(target, observedBox) {
      this.target = target;
      this.observedBox = observedBox || ResizeObserverBoxOptions.CONTENT_BOX;
      this.lastReportedSize = {
        inlineSize: 0,
        blockSize: 0
      };
    }
    ResizeObservation2.prototype.isActive = function() {
      var size2 = calculateBoxSize(this.target, this.observedBox, true);
      if (skipNotifyOnElement(this.target)) {
        this.lastReportedSize = size2;
      }
      if (this.lastReportedSize.inlineSize !== size2.inlineSize || this.lastReportedSize.blockSize !== size2.blockSize) {
        return true;
      }
      return false;
    };
    return ResizeObservation2;
  }();
  var ResizeObserverDetail = /* @__PURE__ */ function() {
    function ResizeObserverDetail2(resizeObserver, callback) {
      this.activeTargets = [];
      this.skippedTargets = [];
      this.observationTargets = [];
      this.observer = resizeObserver;
      this.callback = callback;
    }
    return ResizeObserverDetail2;
  }();
  var observerMap = /* @__PURE__ */ new WeakMap();
  var getObservationIndex = function(observationTargets, target) {
    for (var i2 = 0; i2 < observationTargets.length; i2 += 1) {
      if (observationTargets[i2].target === target) {
        return i2;
      }
    }
    return -1;
  };
  var ResizeObserverController = function() {
    function ResizeObserverController2() {
    }
    ResizeObserverController2.connect = function(resizeObserver, callback) {
      var detail = new ResizeObserverDetail(resizeObserver, callback);
      observerMap.set(resizeObserver, detail);
    };
    ResizeObserverController2.observe = function(resizeObserver, target, options) {
      var detail = observerMap.get(resizeObserver);
      var firstObservation = detail.observationTargets.length === 0;
      if (getObservationIndex(detail.observationTargets, target) < 0) {
        firstObservation && resizeObservers.push(detail);
        detail.observationTargets.push(new ResizeObservation(target, options && options.box));
        updateCount(1);
        scheduler.schedule();
      }
    };
    ResizeObserverController2.unobserve = function(resizeObserver, target) {
      var detail = observerMap.get(resizeObserver);
      var index = getObservationIndex(detail.observationTargets, target);
      var lastObservation = detail.observationTargets.length === 1;
      if (index >= 0) {
        lastObservation && resizeObservers.splice(resizeObservers.indexOf(detail), 1);
        detail.observationTargets.splice(index, 1);
        updateCount(-1);
      }
    };
    ResizeObserverController2.disconnect = function(resizeObserver) {
      var _this = this;
      var detail = observerMap.get(resizeObserver);
      detail.observationTargets.slice().forEach(function(ot) {
        return _this.unobserve(resizeObserver, ot.target);
      });
      detail.activeTargets.splice(0, detail.activeTargets.length);
    };
    return ResizeObserverController2;
  }();
  var ResizeObserver = function() {
    function ResizeObserver2(callback) {
      if (arguments.length === 0) {
        throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");
      }
      if (typeof callback !== "function") {
        throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");
      }
      ResizeObserverController.connect(this, callback);
    }
    ResizeObserver2.prototype.observe = function(target, options) {
      if (arguments.length === 0) {
        throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");
      }
      if (!isElement(target)) {
        throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
      }
      ResizeObserverController.observe(this, target, options);
    };
    ResizeObserver2.prototype.unobserve = function(target) {
      if (arguments.length === 0) {
        throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
      }
      if (!isElement(target)) {
        throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
      }
      ResizeObserverController.unobserve(this, target);
    };
    ResizeObserver2.prototype.disconnect = function() {
      ResizeObserverController.disconnect(this);
    };
    ResizeObserver2.toString = function() {
      return "function ResizeObserver () { [polyfill code] }";
    };
    return ResizeObserver2;
  }();
  class ResizeObserverDelegate {
    constructor() {
      this.handleResize = this.handleResize.bind(this);
      this.observer = new (typeof window !== "undefined" && window.ResizeObserver || ResizeObserver)(this.handleResize);
      this.elHandlersMap = /* @__PURE__ */ new Map();
    }
    handleResize(entries) {
      for (const entry of entries) {
        const handler = this.elHandlersMap.get(entry.target);
        if (handler !== void 0) {
          handler(entry);
        }
      }
    }
    registerHandler(el, handler) {
      this.elHandlersMap.set(el, handler);
      this.observer.observe(el);
    }
    unregisterHandler(el) {
      if (!this.elHandlersMap.has(el)) {
        return;
      }
      this.elHandlersMap.delete(el);
      this.observer.unobserve(el);
    }
  }
  const resizeObserverManager = new ResizeObserverDelegate();
  const VResizeObserver = vue.defineComponent({
    name: "ResizeObserver",
    props: {
      onResize: Function
    },
    setup(props) {
      let registered2 = false;
      const proxy = vue.getCurrentInstance().proxy;
      function handleResize(entry) {
        const { onResize } = props;
        if (onResize !== void 0)
          onResize(entry);
      }
      vue.onMounted(() => {
        const el = proxy.$el;
        if (el === void 0) {
          warn("resize-observer", "$el does not exist.");
          return;
        }
        if (el.nextElementSibling !== el.nextSibling) {
          if (el.nodeType === 3 && el.nodeValue !== "") {
            warn("resize-observer", "$el can not be observed (it may be a text node).");
            return;
          }
        }
        if (el.nextElementSibling !== null) {
          resizeObserverManager.registerHandler(el.nextElementSibling, handleResize);
          registered2 = true;
        }
      });
      vue.onBeforeUnmount(() => {
        if (registered2) {
          resizeObserverManager.unregisterHandler(proxy.$el.nextElementSibling);
        }
      });
    },
    render() {
      return vue.renderSlot(this.$slots, "default");
    }
  });
  function isHTMLElement(node) {
    return node instanceof HTMLElement;
  }
  function focusFirstDescendant(node) {
    for (let i2 = 0; i2 < node.childNodes.length; i2++) {
      const child = node.childNodes[i2];
      if (isHTMLElement(child)) {
        if (attemptFocus(child) || focusFirstDescendant(child)) {
          return true;
        }
      }
    }
    return false;
  }
  function focusLastDescendant(element) {
    for (let i2 = element.childNodes.length - 1; i2 >= 0; i2--) {
      const child = element.childNodes[i2];
      if (isHTMLElement(child)) {
        if (attemptFocus(child) || focusLastDescendant(child)) {
          return true;
        }
      }
    }
    return false;
  }
  function attemptFocus(element) {
    if (!isFocusable(element)) {
      return false;
    }
    try {
      element.focus({ preventScroll: true });
    } catch (e2) {
    }
    return document.activeElement === element;
  }
  function isFocusable(element) {
    if (element.tabIndex > 0 || element.tabIndex === 0 && element.getAttribute("tabIndex") !== null) {
      return true;
    }
    if (element.getAttribute("disabled")) {
      return false;
    }
    switch (element.nodeName) {
      case "A":
        return !!element.href && element.rel !== "ignore";
      case "INPUT":
        return element.type !== "hidden" && element.type !== "file";
      case "BUTTON":
      case "SELECT":
      case "TEXTAREA":
        return true;
      default:
        return false;
    }
  }
  let stack = [];
  const FocusTrap = vue.defineComponent({
    name: "FocusTrap",
    props: {
      disabled: Boolean,
      active: Boolean,
      autoFocus: {
        type: Boolean,
        default: true
      },
      onEsc: Function,
      initialFocusTo: String,
      finalFocusTo: String,
      returnFocusOnDeactivated: {
        type: Boolean,
        default: true
      }
    },
    setup(props) {
      const id = createId();
      const focusableStartRef = vue.ref(null);
      const focusableEndRef = vue.ref(null);
      let activated = false;
      let ignoreInternalFocusChange = false;
      const lastFocusedElement = typeof document === "undefined" ? null : document.activeElement;
      function isCurrentActive() {
        const currentActiveId = stack[stack.length - 1];
        return currentActiveId === id;
      }
      function handleDocumentKeydown(e2) {
        var _a;
        if (e2.code === "Escape") {
          if (isCurrentActive()) {
            (_a = props.onEsc) === null || _a === void 0 ? void 0 : _a.call(props, e2);
          }
        }
      }
      vue.onMounted(() => {
        vue.watch(() => props.active, (value2) => {
          if (value2) {
            activate();
            on("keydown", document, handleDocumentKeydown);
          } else {
            off("keydown", document, handleDocumentKeydown);
            if (activated) {
              deactivate();
            }
          }
        }, {
          immediate: true
        });
      });
      vue.onBeforeUnmount(() => {
        off("keydown", document, handleDocumentKeydown);
        if (activated)
          deactivate();
      });
      function handleDocumentFocus(e2) {
        if (ignoreInternalFocusChange)
          return;
        if (isCurrentActive()) {
          const mainEl = getMainEl();
          if (mainEl === null)
            return;
          if (mainEl.contains(getPreciseEventTarget(e2)))
            return;
          resetFocusTo("first");
        }
      }
      function getMainEl() {
        const focusableStartEl = focusableStartRef.value;
        if (focusableStartEl === null)
          return null;
        let mainEl = focusableStartEl;
        while (true) {
          mainEl = mainEl.nextSibling;
          if (mainEl === null)
            break;
          if (mainEl instanceof Element && mainEl.tagName === "DIV") {
            break;
          }
        }
        return mainEl;
      }
      function activate() {
        var _a;
        if (props.disabled)
          return;
        stack.push(id);
        if (props.autoFocus) {
          const { initialFocusTo } = props;
          if (initialFocusTo === void 0) {
            resetFocusTo("first");
          } else {
            (_a = resolveTo(initialFocusTo)) === null || _a === void 0 ? void 0 : _a.focus({ preventScroll: true });
          }
        }
        activated = true;
        document.addEventListener("focus", handleDocumentFocus, true);
      }
      function deactivate() {
        var _a;
        if (props.disabled)
          return;
        document.removeEventListener("focus", handleDocumentFocus, true);
        stack = stack.filter((idInStack) => idInStack !== id);
        if (isCurrentActive())
          return;
        const { finalFocusTo } = props;
        if (finalFocusTo !== void 0) {
          (_a = resolveTo(finalFocusTo)) === null || _a === void 0 ? void 0 : _a.focus({ preventScroll: true });
        } else if (props.returnFocusOnDeactivated) {
          if (lastFocusedElement instanceof HTMLElement) {
            ignoreInternalFocusChange = true;
            lastFocusedElement.focus({ preventScroll: true });
            ignoreInternalFocusChange = false;
          }
        }
      }
      function resetFocusTo(target) {
        if (!isCurrentActive())
          return;
        if (props.active) {
          const focusableStartEl = focusableStartRef.value;
          const focusableEndEl = focusableEndRef.value;
          if (focusableStartEl !== null && focusableEndEl !== null) {
            const mainEl = getMainEl();
            if (mainEl == null || mainEl === focusableEndEl) {
              ignoreInternalFocusChange = true;
              focusableStartEl.focus({ preventScroll: true });
              ignoreInternalFocusChange = false;
              return;
            }
            ignoreInternalFocusChange = true;
            const focused = target === "first" ? focusFirstDescendant(mainEl) : focusLastDescendant(mainEl);
            ignoreInternalFocusChange = false;
            if (!focused) {
              ignoreInternalFocusChange = true;
              focusableStartEl.focus({ preventScroll: true });
              ignoreInternalFocusChange = false;
            }
          }
        }
      }
      function handleStartFocus(e2) {
        if (ignoreInternalFocusChange)
          return;
        const mainEl = getMainEl();
        if (mainEl === null)
          return;
        if (e2.relatedTarget !== null && mainEl.contains(e2.relatedTarget)) {
          resetFocusTo("last");
        } else {
          resetFocusTo("first");
        }
      }
      function handleEndFocus(e2) {
        if (ignoreInternalFocusChange)
          return;
        if (e2.relatedTarget !== null && e2.relatedTarget === focusableStartRef.value) {
          resetFocusTo("last");
        } else {
          resetFocusTo("first");
        }
      }
      return {
        focusableStartRef,
        focusableEndRef,
        focusableStyle: "position: absolute; height: 0; width: 0;",
        handleStartFocus,
        handleEndFocus
      };
    },
    render() {
      const { default: defaultSlot } = this.$slots;
      if (defaultSlot === void 0)
        return null;
      if (this.disabled)
        return defaultSlot();
      const { active, focusableStyle } = this;
      return vue.h(vue.Fragment, null, [
        vue.h("div", {
          "aria-hidden": "true",
          tabindex: active ? "0" : "-1",
          ref: "focusableStartRef",
          style: focusableStyle,
          onFocus: this.handleStartFocus
        }),
        defaultSlot(),
        vue.h("div", {
          "aria-hidden": "true",
          style: focusableStyle,
          ref: "focusableEndRef",
          tabindex: active ? "0" : "-1",
          onFocus: this.handleEndFocus
        })
      ]);
    }
  });
  let lockCount = 0;
  let originalMarginRight = "";
  let originalOverflow = "";
  let originalOverflowX = "";
  let originalOverflowY = "";
  const lockHtmlScrollRightCompensationRef = vue.ref("0px");
  function useLockHtmlScroll(lockRef) {
    if (typeof document === "undefined")
      return;
    const el = document.documentElement;
    let watchStopHandle;
    let activated = false;
    const unlock = () => {
      el.style.marginRight = originalMarginRight;
      el.style.overflow = originalOverflow;
      el.style.overflowX = originalOverflowX;
      el.style.overflowY = originalOverflowY;
      lockHtmlScrollRightCompensationRef.value = "0px";
    };
    vue.onMounted(() => {
      watchStopHandle = vue.watch(lockRef, (value2) => {
        if (value2) {
          if (!lockCount) {
            const scrollbarWidth = window.innerWidth - el.offsetWidth;
            if (scrollbarWidth > 0) {
              originalMarginRight = el.style.marginRight;
              el.style.marginRight = `${scrollbarWidth}px`;
              lockHtmlScrollRightCompensationRef.value = `${scrollbarWidth}px`;
            }
            originalOverflow = el.style.overflow;
            originalOverflowX = el.style.overflowX;
            originalOverflowY = el.style.overflowY;
            el.style.overflow = "hidden";
            el.style.overflowX = "hidden";
            el.style.overflowY = "hidden";
          }
          activated = true;
          lockCount++;
        } else {
          lockCount--;
          if (!lockCount) {
            unlock();
          }
          activated = false;
        }
      }, {
        immediate: true
      });
    });
    vue.onBeforeUnmount(() => {
      watchStopHandle === null || watchStopHandle === void 0 ? void 0 : watchStopHandle();
      if (activated) {
        lockCount--;
        if (!lockCount) {
          unlock();
        }
        activated = false;
      }
    });
  }
  const isComposingRef = vue.ref(false);
  const compositionStartHandler = () => {
    isComposingRef.value = true;
  };
  const compositionEndHandler = () => {
    isComposingRef.value = false;
  };
  let mountedCount = 0;
  const useIsComposing = () => {
    if (isBrowser$2) {
      vue.onBeforeMount(() => {
        if (!mountedCount) {
          window.addEventListener("compositionstart", compositionStartHandler);
          window.addEventListener("compositionend", compositionEndHandler);
        }
        mountedCount++;
      });
      vue.onBeforeUnmount(() => {
        if (mountedCount <= 1) {
          window.removeEventListener("compositionstart", compositionStartHandler);
          window.removeEventListener("compositionend", compositionEndHandler);
          mountedCount = 0;
        } else {
          mountedCount--;
        }
      });
    }
    return isComposingRef;
  };
  function useReactivated(callback) {
    const isDeactivatedRef = {
      isDeactivated: false
    };
    let activateStateInitialized = false;
    vue.onActivated(() => {
      isDeactivatedRef.isDeactivated = false;
      if (!activateStateInitialized) {
        activateStateInitialized = true;
        return;
      }
      callback();
    });
    vue.onDeactivated(() => {
      isDeactivatedRef.isDeactivated = true;
      if (!activateStateInitialized) {
        activateStateInitialized = true;
      }
    });
    return isDeactivatedRef;
  }
  const formItemInjectionKey = createInjectionKey("n-form-item");
  function useFormItem(props, {
    defaultSize = "medium",
    mergedSize,
    mergedDisabled
  } = {}) {
    const NFormItem = vue.inject(formItemInjectionKey, null);
    vue.provide(formItemInjectionKey, null);
    const mergedSizeRef = vue.computed(mergedSize ? () => mergedSize(NFormItem) : () => {
      const {
        size: size2
      } = props;
      if (size2)
        return size2;
      if (NFormItem) {
        const {
          mergedSize: mergedSize2
        } = NFormItem;
        if (mergedSize2.value !== void 0) {
          return mergedSize2.value;
        }
      }
      return defaultSize;
    });
    const mergedDisabledRef = vue.computed(mergedDisabled ? () => mergedDisabled(NFormItem) : () => {
      const {
        disabled
      } = props;
      if (disabled !== void 0) {
        return disabled;
      }
      if (NFormItem) {
        return NFormItem.disabled.value;
      }
      return false;
    });
    const mergedStatusRef = vue.computed(() => {
      const {
        status
      } = props;
      if (status)
        return status;
      return NFormItem === null || NFormItem === void 0 ? void 0 : NFormItem.mergedValidationStatus.value;
    });
    vue.onBeforeUnmount(() => {
      if (NFormItem) {
        NFormItem.restoreValidation();
      }
    });
    return {
      mergedSizeRef,
      mergedDisabledRef,
      mergedStatusRef,
      nTriggerFormBlur() {
        if (NFormItem) {
          NFormItem.handleContentBlur();
        }
      },
      nTriggerFormChange() {
        if (NFormItem) {
          NFormItem.handleContentChange();
        }
      },
      nTriggerFormFocus() {
        if (NFormItem) {
          NFormItem.handleContentFocus();
        }
      },
      nTriggerFormInput() {
        if (NFormItem) {
          NFormItem.handleContentInput();
        }
      }
    };
  }
  var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
  var freeSelf = typeof self == "object" && self && self.Object === Object && self;
  var root = freeGlobal || freeSelf || Function("return this")();
  var Symbol$1 = root.Symbol;
  var objectProto$a = Object.prototype;
  var hasOwnProperty$8 = objectProto$a.hasOwnProperty;
  var nativeObjectToString$1 = objectProto$a.toString;
  var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : void 0;
  function getRawTag(value2) {
    var isOwn = hasOwnProperty$8.call(value2, symToStringTag$1), tag = value2[symToStringTag$1];
    try {
      value2[symToStringTag$1] = void 0;
      var unmasked = true;
    } catch (e2) {
    }
    var result = nativeObjectToString$1.call(value2);
    if (unmasked) {
      if (isOwn) {
        value2[symToStringTag$1] = tag;
      } else {
        delete value2[symToStringTag$1];
      }
    }
    return result;
  }
  var objectProto$9 = Object.prototype;
  var nativeObjectToString = objectProto$9.toString;
  function objectToString(value2) {
    return nativeObjectToString.call(value2);
  }
  var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
  var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : void 0;
  function baseGetTag(value2) {
    if (value2 == null) {
      return value2 === void 0 ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value2) ? getRawTag(value2) : objectToString(value2);
  }
  function isObjectLike(value2) {
    return value2 != null && typeof value2 == "object";
  }
  var symbolTag = "[object Symbol]";
  function isSymbol(value2) {
    return typeof value2 == "symbol" || isObjectLike(value2) && baseGetTag(value2) == symbolTag;
  }
  function arrayMap(array, iteratee) {
    var index = -1, length = array == null ? 0 : array.length, result = Array(length);
    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }
  var isArray = Array.isArray;
  var INFINITY = 1 / 0;
  var symbolProto = Symbol$1 ? Symbol$1.prototype : void 0, symbolToString = symbolProto ? symbolProto.toString : void 0;
  function baseToString(value2) {
    if (typeof value2 == "string") {
      return value2;
    }
    if (isArray(value2)) {
      return arrayMap(value2, baseToString) + "";
    }
    if (isSymbol(value2)) {
      return symbolToString ? symbolToString.call(value2) : "";
    }
    var result = value2 + "";
    return result == "0" && 1 / value2 == -INFINITY ? "-0" : result;
  }
  function isObject(value2) {
    var type2 = typeof value2;
    return value2 != null && (type2 == "object" || type2 == "function");
  }
  function identity(value2) {
    return value2;
  }
  var asyncTag = "[object AsyncFunction]", funcTag$1 = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
  function isFunction(value2) {
    if (!isObject(value2)) {
      return false;
    }
    var tag = baseGetTag(value2);
    return tag == funcTag$1 || tag == genTag || tag == asyncTag || tag == proxyTag;
  }
  var coreJsData = root["__core-js_shared__"];
  var maskSrcKey = function() {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
    return uid ? "Symbol(src)_1." + uid : "";
  }();
  function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }
  var funcProto$2 = Function.prototype;
  var funcToString$2 = funcProto$2.toString;
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString$2.call(func);
      } catch (e2) {
      }
      try {
        return func + "";
      } catch (e2) {
      }
    }
    return "";
  }
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
  var reIsHostCtor = /^\[object .+?Constructor\]$/;
  var funcProto$1 = Function.prototype, objectProto$8 = Object.prototype;
  var funcToString$1 = funcProto$1.toString;
  var hasOwnProperty$7 = objectProto$8.hasOwnProperty;
  var reIsNative = RegExp(
    "^" + funcToString$1.call(hasOwnProperty$7).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  );
  function baseIsNative(value2) {
    if (!isObject(value2) || isMasked(value2)) {
      return false;
    }
    var pattern = isFunction(value2) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value2));
  }
  function getValue(object, key) {
    return object == null ? void 0 : object[key];
  }
  function getNative(object, key) {
    var value2 = getValue(object, key);
    return baseIsNative(value2) ? value2 : void 0;
  }
  var objectCreate = Object.create;
  var baseCreate = /* @__PURE__ */ function() {
    function object() {
    }
    return function(proto) {
      if (!isObject(proto)) {
        return {};
      }
      if (objectCreate) {
        return objectCreate(proto);
      }
      object.prototype = proto;
      var result = new object();
      object.prototype = void 0;
      return result;
    };
  }();
  function apply(func, thisArg, args) {
    switch (args.length) {
      case 0:
        return func.call(thisArg);
      case 1:
        return func.call(thisArg, args[0]);
      case 2:
        return func.call(thisArg, args[0], args[1]);
      case 3:
        return func.call(thisArg, args[0], args[1], args[2]);
    }
    return func.apply(thisArg, args);
  }
  function copyArray(source, array) {
    var index = -1, length = source.length;
    array || (array = Array(length));
    while (++index < length) {
      array[index] = source[index];
    }
    return array;
  }
  var HOT_COUNT = 800, HOT_SPAN = 16;
  var nativeNow = Date.now;
  function shortOut(func) {
    var count = 0, lastCalled = 0;
    return function() {
      var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
      lastCalled = stamp;
      if (remaining > 0) {
        if (++count >= HOT_COUNT) {
          return arguments[0];
        }
      } else {
        count = 0;
      }
      return func.apply(void 0, arguments);
    };
  }
  function constant(value2) {
    return function() {
      return value2;
    };
  }
  var defineProperty = function() {
    try {
      var func = getNative(Object, "defineProperty");
      func({}, "", {});
      return func;
    } catch (e2) {
    }
  }();
  var baseSetToString = !defineProperty ? identity : function(func, string) {
    return defineProperty(func, "toString", {
      "configurable": true,
      "enumerable": false,
      "value": constant(string),
      "writable": true
    });
  };
  const baseSetToString$1 = baseSetToString;
  var setToString = shortOut(baseSetToString$1);
  var MAX_SAFE_INTEGER$1 = 9007199254740991;
  var reIsUint = /^(?:0|[1-9]\d*)$/;
  function isIndex(value2, length) {
    var type2 = typeof value2;
    length = length == null ? MAX_SAFE_INTEGER$1 : length;
    return !!length && (type2 == "number" || type2 != "symbol" && reIsUint.test(value2)) && (value2 > -1 && value2 % 1 == 0 && value2 < length);
  }
  function baseAssignValue(object, key, value2) {
    if (key == "__proto__" && defineProperty) {
      defineProperty(object, key, {
        "configurable": true,
        "enumerable": true,
        "value": value2,
        "writable": true
      });
    } else {
      object[key] = value2;
    }
  }
  function eq(value2, other) {
    return value2 === other || value2 !== value2 && other !== other;
  }
  var objectProto$7 = Object.prototype;
  var hasOwnProperty$6 = objectProto$7.hasOwnProperty;
  function assignValue(object, key, value2) {
    var objValue = object[key];
    if (!(hasOwnProperty$6.call(object, key) && eq(objValue, value2)) || value2 === void 0 && !(key in object)) {
      baseAssignValue(object, key, value2);
    }
  }
  function copyObject(source, props, object, customizer) {
    var isNew = !object;
    object || (object = {});
    var index = -1, length = props.length;
    while (++index < length) {
      var key = props[index];
      var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
      if (newValue === void 0) {
        newValue = source[key];
      }
      if (isNew) {
        baseAssignValue(object, key, newValue);
      } else {
        assignValue(object, key, newValue);
      }
    }
    return object;
  }
  var nativeMax = Math.max;
  function overRest(func, start, transform) {
    start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
    return function() {
      var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
      while (++index < length) {
        array[index] = args[start + index];
      }
      index = -1;
      var otherArgs = Array(start + 1);
      while (++index < start) {
        otherArgs[index] = args[index];
      }
      otherArgs[start] = transform(array);
      return apply(func, this, otherArgs);
    };
  }
  function baseRest(func, start) {
    return setToString(overRest(func, start, identity), func + "");
  }
  var MAX_SAFE_INTEGER = 9007199254740991;
  function isLength(value2) {
    return typeof value2 == "number" && value2 > -1 && value2 % 1 == 0 && value2 <= MAX_SAFE_INTEGER;
  }
  function isArrayLike(value2) {
    return value2 != null && isLength(value2.length) && !isFunction(value2);
  }
  function isIterateeCall(value2, index, object) {
    if (!isObject(object)) {
      return false;
    }
    var type2 = typeof index;
    if (type2 == "number" ? isArrayLike(object) && isIndex(index, object.length) : type2 == "string" && index in object) {
      return eq(object[index], value2);
    }
    return false;
  }
  function createAssigner(assigner) {
    return baseRest(function(object, sources) {
      var index = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : void 0, guard2 = length > 2 ? sources[2] : void 0;
      customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : void 0;
      if (guard2 && isIterateeCall(sources[0], sources[1], guard2)) {
        customizer = length < 3 ? void 0 : customizer;
        length = 1;
      }
      object = Object(object);
      while (++index < length) {
        var source = sources[index];
        if (source) {
          assigner(object, source, index, customizer);
        }
      }
      return object;
    });
  }
  var objectProto$6 = Object.prototype;
  function isPrototype(value2) {
    var Ctor = value2 && value2.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto$6;
    return value2 === proto;
  }
  function baseTimes(n2, iteratee) {
    var index = -1, result = Array(n2);
    while (++index < n2) {
      result[index] = iteratee(index);
    }
    return result;
  }
  var argsTag$1 = "[object Arguments]";
  function baseIsArguments(value2) {
    return isObjectLike(value2) && baseGetTag(value2) == argsTag$1;
  }
  var objectProto$5 = Object.prototype;
  var hasOwnProperty$5 = objectProto$5.hasOwnProperty;
  var propertyIsEnumerable = objectProto$5.propertyIsEnumerable;
  var isArguments = baseIsArguments(/* @__PURE__ */ function() {
    return arguments;
  }()) ? baseIsArguments : function(value2) {
    return isObjectLike(value2) && hasOwnProperty$5.call(value2, "callee") && !propertyIsEnumerable.call(value2, "callee");
  };
  const isArguments$1 = isArguments;
  function stubFalse() {
    return false;
  }
  var freeExports$2 = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
  var freeModule$2 = freeExports$2 && typeof module == "object" && module && !module.nodeType && module;
  var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;
  var Buffer$1 = moduleExports$2 ? root.Buffer : void 0;
  var nativeIsBuffer = Buffer$1 ? Buffer$1.isBuffer : void 0;
  var isBuffer = nativeIsBuffer || stubFalse;
  var argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", mapTag = "[object Map]", numberTag = "[object Number]", objectTag$1 = "[object Object]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", weakMapTag = "[object WeakMap]";
  var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag$1] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
  function baseIsTypedArray(value2) {
    return isObjectLike(value2) && isLength(value2.length) && !!typedArrayTags[baseGetTag(value2)];
  }
  function baseUnary(func) {
    return function(value2) {
      return func(value2);
    };
  }
  var freeExports$1 = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
  var freeModule$1 = freeExports$1 && typeof module == "object" && module && !module.nodeType && module;
  var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;
  var freeProcess = moduleExports$1 && freeGlobal.process;
  var nodeUtil = function() {
    try {
      var types = freeModule$1 && freeModule$1.require && freeModule$1.require("util").types;
      if (types) {
        return types;
      }
      return freeProcess && freeProcess.binding && freeProcess.binding("util");
    } catch (e2) {
    }
  }();
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
  var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
  var objectProto$4 = Object.prototype;
  var hasOwnProperty$4 = objectProto$4.hasOwnProperty;
  function arrayLikeKeys(value2, inherited) {
    var isArr = isArray(value2), isArg = !isArr && isArguments$1(value2), isBuff = !isArr && !isArg && isBuffer(value2), isType = !isArr && !isArg && !isBuff && isTypedArray(value2), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value2.length, String) : [], length = result.length;
    for (var key in value2) {
      if ((inherited || hasOwnProperty$4.call(value2, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
      (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
      isIndex(key, length)))) {
        result.push(key);
      }
    }
    return result;
  }
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }
  function nativeKeysIn(object) {
    var result = [];
    if (object != null) {
      for (var key in Object(object)) {
        result.push(key);
      }
    }
    return result;
  }
  var objectProto$3 = Object.prototype;
  var hasOwnProperty$3 = objectProto$3.hasOwnProperty;
  function baseKeysIn(object) {
    if (!isObject(object)) {
      return nativeKeysIn(object);
    }
    var isProto = isPrototype(object), result = [];
    for (var key in object) {
      if (!(key == "constructor" && (isProto || !hasOwnProperty$3.call(object, key)))) {
        result.push(key);
      }
    }
    return result;
  }
  function keysIn(object) {
    return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
  }
  var nativeCreate = getNative(Object, "create");
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
    this.size = 0;
  }
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }
  var HASH_UNDEFINED$1 = "__lodash_hash_undefined__";
  var objectProto$2 = Object.prototype;
  var hasOwnProperty$2 = objectProto$2.hasOwnProperty;
  function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED$1 ? void 0 : result;
    }
    return hasOwnProperty$2.call(data, key) ? data[key] : void 0;
  }
  var objectProto$1 = Object.prototype;
  var hasOwnProperty$1 = objectProto$1.hasOwnProperty;
  function hashHas(key) {
    var data = this.__data__;
    return nativeCreate ? data[key] !== void 0 : hasOwnProperty$1.call(data, key);
  }
  var HASH_UNDEFINED = "__lodash_hash_undefined__";
  function hashSet(key, value2) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = nativeCreate && value2 === void 0 ? HASH_UNDEFINED : value2;
    return this;
  }
  function Hash(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  Hash.prototype.clear = hashClear;
  Hash.prototype["delete"] = hashDelete;
  Hash.prototype.get = hashGet;
  Hash.prototype.has = hashHas;
  Hash.prototype.set = hashSet;
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }
  var arrayProto = Array.prototype;
  var splice = arrayProto.splice;
  function listCacheDelete(key) {
    var data = this.__data__, index = assocIndexOf(data, key);
    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }
  function listCacheGet(key) {
    var data = this.__data__, index = assocIndexOf(data, key);
    return index < 0 ? void 0 : data[index][1];
  }
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
  }
  function listCacheSet(key, value2) {
    var data = this.__data__, index = assocIndexOf(data, key);
    if (index < 0) {
      ++this.size;
      data.push([key, value2]);
    } else {
      data[index][1] = value2;
    }
    return this;
  }
  function ListCache(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  ListCache.prototype.clear = listCacheClear;
  ListCache.prototype["delete"] = listCacheDelete;
  ListCache.prototype.get = listCacheGet;
  ListCache.prototype.has = listCacheHas;
  ListCache.prototype.set = listCacheSet;
  var Map$1 = getNative(root, "Map");
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      "hash": new Hash(),
      "map": new (Map$1 || ListCache)(),
      "string": new Hash()
    };
  }
  function isKeyable(value2) {
    var type2 = typeof value2;
    return type2 == "string" || type2 == "number" || type2 == "symbol" || type2 == "boolean" ? value2 !== "__proto__" : value2 === null;
  }
  function getMapData(map, key) {
    var data = map.__data__;
    return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
  }
  function mapCacheDelete(key) {
    var result = getMapData(this, key)["delete"](key);
    this.size -= result ? 1 : 0;
    return result;
  }
  function mapCacheGet(key) {
    return getMapData(this, key).get(key);
  }
  function mapCacheHas(key) {
    return getMapData(this, key).has(key);
  }
  function mapCacheSet(key, value2) {
    var data = getMapData(this, key), size2 = data.size;
    data.set(key, value2);
    this.size += data.size == size2 ? 0 : 1;
    return this;
  }
  function MapCache(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  MapCache.prototype.clear = mapCacheClear;
  MapCache.prototype["delete"] = mapCacheDelete;
  MapCache.prototype.get = mapCacheGet;
  MapCache.prototype.has = mapCacheHas;
  MapCache.prototype.set = mapCacheSet;
  function toString(value2) {
    return value2 == null ? "" : baseToString(value2);
  }
  var getPrototype = overArg(Object.getPrototypeOf, Object);
  var objectTag = "[object Object]";
  var funcProto = Function.prototype, objectProto = Object.prototype;
  var funcToString = funcProto.toString;
  var hasOwnProperty = objectProto.hasOwnProperty;
  var objectCtorString = funcToString.call(Object);
  function isPlainObject(value2) {
    if (!isObjectLike(value2) || baseGetTag(value2) != objectTag) {
      return false;
    }
    var proto = getPrototype(value2);
    if (proto === null) {
      return true;
    }
    var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
    return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
  }
  function baseSlice(array, start, end) {
    var index = -1, length = array.length;
    if (start < 0) {
      start = -start > length ? 0 : length + start;
    }
    end = end > length ? length : end;
    if (end < 0) {
      end += length;
    }
    length = start > end ? 0 : end - start >>> 0;
    start >>>= 0;
    var result = Array(length);
    while (++index < length) {
      result[index] = array[index + start];
    }
    return result;
  }
  function castSlice(array, start, end) {
    var length = array.length;
    end = end === void 0 ? length : end;
    return !start && end >= length ? array : baseSlice(array, start, end);
  }
  var rsAstralRange$1 = "\\ud800-\\udfff", rsComboMarksRange$1 = "\\u0300-\\u036f", reComboHalfMarksRange$1 = "\\ufe20-\\ufe2f", rsComboSymbolsRange$1 = "\\u20d0-\\u20ff", rsComboRange$1 = rsComboMarksRange$1 + reComboHalfMarksRange$1 + rsComboSymbolsRange$1, rsVarRange$1 = "\\ufe0e\\ufe0f";
  var rsZWJ$1 = "\\u200d";
  var reHasUnicode = RegExp("[" + rsZWJ$1 + rsAstralRange$1 + rsComboRange$1 + rsVarRange$1 + "]");
  function hasUnicode(string) {
    return reHasUnicode.test(string);
  }
  function asciiToArray(string) {
    return string.split("");
  }
  var rsAstralRange = "\\ud800-\\udfff", rsComboMarksRange = "\\u0300-\\u036f", reComboHalfMarksRange = "\\ufe20-\\ufe2f", rsComboSymbolsRange = "\\u20d0-\\u20ff", rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange, rsVarRange = "\\ufe0e\\ufe0f";
  var rsAstral = "[" + rsAstralRange + "]", rsCombo = "[" + rsComboRange + "]", rsFitz = "\\ud83c[\\udffb-\\udfff]", rsModifier = "(?:" + rsCombo + "|" + rsFitz + ")", rsNonAstral = "[^" + rsAstralRange + "]", rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}", rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]", rsZWJ = "\\u200d";
  var reOptMod = rsModifier + "?", rsOptVar = "[" + rsVarRange + "]?", rsOptJoin = "(?:" + rsZWJ + "(?:" + [rsNonAstral, rsRegional, rsSurrPair].join("|") + ")" + rsOptVar + reOptMod + ")*", rsSeq = rsOptVar + reOptMod + rsOptJoin, rsSymbol = "(?:" + [rsNonAstral + rsCombo + "?", rsCombo, rsRegional, rsSurrPair, rsAstral].join("|") + ")";
  var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");
  function unicodeToArray(string) {
    return string.match(reUnicode) || [];
  }
  function stringToArray(string) {
    return hasUnicode(string) ? unicodeToArray(string) : asciiToArray(string);
  }
  function createCaseFirst(methodName) {
    return function(string) {
      string = toString(string);
      var strSymbols = hasUnicode(string) ? stringToArray(string) : void 0;
      var chr = strSymbols ? strSymbols[0] : string.charAt(0);
      var trailing = strSymbols ? castSlice(strSymbols, 1).join("") : string.slice(1);
      return chr[methodName]() + trailing;
    };
  }
  var upperFirst = createCaseFirst("toUpperCase");
  function stackClear() {
    this.__data__ = new ListCache();
    this.size = 0;
  }
  function stackDelete(key) {
    var data = this.__data__, result = data["delete"](key);
    this.size = data.size;
    return result;
  }
  function stackGet(key) {
    return this.__data__.get(key);
  }
  function stackHas(key) {
    return this.__data__.has(key);
  }
  var LARGE_ARRAY_SIZE = 200;
  function stackSet(key, value2) {
    var data = this.__data__;
    if (data instanceof ListCache) {
      var pairs = data.__data__;
      if (!Map$1 || pairs.length < LARGE_ARRAY_SIZE - 1) {
        pairs.push([key, value2]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new MapCache(pairs);
    }
    data.set(key, value2);
    this.size = data.size;
    return this;
  }
  function Stack(entries) {
    var data = this.__data__ = new ListCache(entries);
    this.size = data.size;
  }
  Stack.prototype.clear = stackClear;
  Stack.prototype["delete"] = stackDelete;
  Stack.prototype.get = stackGet;
  Stack.prototype.has = stackHas;
  Stack.prototype.set = stackSet;
  var freeExports = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
  var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
  var moduleExports = freeModule && freeModule.exports === freeExports;
  var Buffer2 = moduleExports ? root.Buffer : void 0, allocUnsafe = Buffer2 ? Buffer2.allocUnsafe : void 0;
  function cloneBuffer(buffer, isDeep) {
    if (isDeep) {
      return buffer.slice();
    }
    var length = buffer.length, result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
    buffer.copy(result);
    return result;
  }
  var Uint8Array$1 = root.Uint8Array;
  function cloneArrayBuffer(arrayBuffer) {
    var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
    new Uint8Array$1(result).set(new Uint8Array$1(arrayBuffer));
    return result;
  }
  function cloneTypedArray(typedArray, isDeep) {
    var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
    return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
  }
  function initCloneObject(object) {
    return typeof object.constructor == "function" && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
  }
  function createBaseFor(fromRight) {
    return function(object, iteratee, keysFunc) {
      var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
      while (length--) {
        var key = props[fromRight ? length : ++index];
        if (iteratee(iterable[key], key, iterable) === false) {
          break;
        }
      }
      return object;
    };
  }
  var baseFor = createBaseFor();
  function assignMergeValue(object, key, value2) {
    if (value2 !== void 0 && !eq(object[key], value2) || value2 === void 0 && !(key in object)) {
      baseAssignValue(object, key, value2);
    }
  }
  function isArrayLikeObject(value2) {
    return isObjectLike(value2) && isArrayLike(value2);
  }
  function safeGet(object, key) {
    if (key === "constructor" && typeof object[key] === "function") {
      return;
    }
    if (key == "__proto__") {
      return;
    }
    return object[key];
  }
  function toPlainObject(value2) {
    return copyObject(value2, keysIn(value2));
  }
  function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack2) {
    var objValue = safeGet(object, key), srcValue = safeGet(source, key), stacked = stack2.get(srcValue);
    if (stacked) {
      assignMergeValue(object, key, stacked);
      return;
    }
    var newValue = customizer ? customizer(objValue, srcValue, key + "", object, source, stack2) : void 0;
    var isCommon = newValue === void 0;
    if (isCommon) {
      var isArr = isArray(srcValue), isBuff = !isArr && isBuffer(srcValue), isTyped = !isArr && !isBuff && isTypedArray(srcValue);
      newValue = srcValue;
      if (isArr || isBuff || isTyped) {
        if (isArray(objValue)) {
          newValue = objValue;
        } else if (isArrayLikeObject(objValue)) {
          newValue = copyArray(objValue);
        } else if (isBuff) {
          isCommon = false;
          newValue = cloneBuffer(srcValue, true);
        } else if (isTyped) {
          isCommon = false;
          newValue = cloneTypedArray(srcValue, true);
        } else {
          newValue = [];
        }
      } else if (isPlainObject(srcValue) || isArguments$1(srcValue)) {
        newValue = objValue;
        if (isArguments$1(objValue)) {
          newValue = toPlainObject(objValue);
        } else if (!isObject(objValue) || isFunction(objValue)) {
          newValue = initCloneObject(srcValue);
        }
      } else {
        isCommon = false;
      }
    }
    if (isCommon) {
      stack2.set(srcValue, newValue);
      mergeFunc(newValue, srcValue, srcIndex, customizer, stack2);
      stack2["delete"](srcValue);
    }
    assignMergeValue(object, key, newValue);
  }
  function baseMerge(object, source, srcIndex, customizer, stack2) {
    if (object === source) {
      return;
    }
    baseFor(source, function(srcValue, key) {
      stack2 || (stack2 = new Stack());
      if (isObject(srcValue)) {
        baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack2);
      } else {
        var newValue = customizer ? customizer(safeGet(object, key), srcValue, key + "", object, source, stack2) : void 0;
        if (newValue === void 0) {
          newValue = srcValue;
        }
        assignMergeValue(object, key, newValue);
      }
    }, keysIn);
  }
  var merge = createAssigner(function(object, source, srcIndex) {
    baseMerge(object, source, srcIndex);
  });
  const commonVariables$2 = {
    fontFamily: 'v-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    fontFamilyMono: "v-mono, SFMono-Regular, Menlo, Consolas, Courier, monospace",
    fontWeight: "400",
    fontWeightStrong: "500",
    cubicBezierEaseInOut: "cubic-bezier(.4, 0, .2, 1)",
    cubicBezierEaseOut: "cubic-bezier(0, 0, .2, 1)",
    cubicBezierEaseIn: "cubic-bezier(.4, 0, 1, 1)",
    borderRadius: "3px",
    borderRadiusSmall: "2px",
    fontSize: "14px",
    fontSizeMini: "12px",
    fontSizeTiny: "12px",
    fontSizeSmall: "14px",
    fontSizeMedium: "14px",
    fontSizeLarge: "15px",
    fontSizeHuge: "16px",
    lineHeight: "1.6",
    heightMini: "16px",
    // private now, it's too small
    heightTiny: "22px",
    heightSmall: "28px",
    heightMedium: "34px",
    heightLarge: "40px",
    heightHuge: "46px"
  };
  const {
    fontSize,
    fontFamily,
    lineHeight
  } = commonVariables$2;
  const globalStyle = c("body", `
 margin: 0;
 font-size: ${fontSize};
 font-family: ${fontFamily};
 line-height: ${lineHeight};
 -webkit-text-size-adjust: 100%;
 -webkit-tap-highlight-color: transparent;
`, [c("input", `
 font-family: inherit;
 font-size: inherit;
 `)]);
  const configProviderInjectionKey = createInjectionKey("n-config-provider");
  const cssrAnchorMetaName = "naive-ui-style";
  function createTheme(theme) {
    return theme;
  }
  function useTheme(resolveId, mountId, style2, defaultTheme, props, clsPrefixRef) {
    const ssrAdapter2 = useSsrAdapter();
    const NConfigProvider = vue.inject(configProviderInjectionKey, null);
    if (style2) {
      const mountStyle = () => {
        const clsPrefix = clsPrefixRef === null || clsPrefixRef === void 0 ? void 0 : clsPrefixRef.value;
        style2.mount({
          id: clsPrefix === void 0 ? mountId : clsPrefix + mountId,
          head: true,
          props: {
            bPrefix: clsPrefix ? `.${clsPrefix}-` : void 0
          },
          anchorMetaName: cssrAnchorMetaName,
          ssr: ssrAdapter2
        });
        if (!(NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.preflightStyleDisabled)) {
          globalStyle.mount({
            id: "n-global",
            head: true,
            anchorMetaName: cssrAnchorMetaName,
            ssr: ssrAdapter2
          });
        }
      };
      if (ssrAdapter2) {
        mountStyle();
      } else {
        vue.onBeforeMount(mountStyle);
      }
    }
    const mergedThemeRef = vue.computed(() => {
      var _a;
      const {
        theme: {
          common: selfCommon,
          self: self2,
          peers = {}
        } = {},
        themeOverrides: selfOverrides = {},
        builtinThemeOverrides: builtinOverrides = {}
      } = props;
      const {
        common: selfCommonOverrides,
        peers: peersOverrides
      } = selfOverrides;
      const {
        common: globalCommon = void 0,
        [resolveId]: {
          common: globalSelfCommon = void 0,
          self: globalSelf = void 0,
          peers: globalPeers = {}
        } = {}
      } = (NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedThemeRef.value) || {};
      const {
        common: globalCommonOverrides = void 0,
        [resolveId]: globalSelfOverrides = {}
      } = (NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedThemeOverridesRef.value) || {};
      const {
        common: globalSelfCommonOverrides,
        peers: globalPeersOverrides = {}
      } = globalSelfOverrides;
      const mergedCommon = merge({}, selfCommon || globalSelfCommon || globalCommon || defaultTheme.common, globalCommonOverrides, globalSelfCommonOverrides, selfCommonOverrides);
      const mergedSelf = merge(
        // {}, executed every time, no need for empty obj
        (_a = self2 || globalSelf || defaultTheme.self) === null || _a === void 0 ? void 0 : _a(mergedCommon),
        builtinOverrides,
        globalSelfOverrides,
        selfOverrides
      );
      return {
        common: mergedCommon,
        self: mergedSelf,
        peers: merge({}, defaultTheme.peers, globalPeers, peers),
        peerOverrides: merge({}, builtinOverrides.peers, globalPeersOverrides, peersOverrides)
      };
    });
    return mergedThemeRef;
  }
  useTheme.props = {
    theme: Object,
    themeOverrides: Object,
    builtinThemeOverrides: Object
  };
  const defaultClsPrefix = "n";
  function useConfig(props = {}, options = {
    defaultBordered: true
  }) {
    const NConfigProvider = vue.inject(configProviderInjectionKey, null);
    return {
      // NConfigProvider,
      inlineThemeDisabled: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.inlineThemeDisabled,
      mergedRtlRef: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedRtlRef,
      mergedComponentPropsRef: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedComponentPropsRef,
      mergedBreakpointsRef: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedBreakpointsRef,
      mergedBorderedRef: vue.computed(() => {
        var _a, _b;
        const {
          bordered
        } = props;
        if (bordered !== void 0)
          return bordered;
        return (_b = (_a = NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedBorderedRef.value) !== null && _a !== void 0 ? _a : options.defaultBordered) !== null && _b !== void 0 ? _b : true;
      }),
      mergedClsPrefixRef: NConfigProvider ? NConfigProvider.mergedClsPrefixRef : vue.shallowRef(defaultClsPrefix),
      namespaceRef: vue.computed(() => NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedNamespaceRef.value)
    };
  }
  function useStyle(mountId, style2, clsPrefixRef) {
    if (!style2) {
      if (process.env.NODE_ENV !== "production")
        throwError("use-style", "No style is specified.");
      return;
    }
    const ssrAdapter2 = useSsrAdapter();
    const NConfigProvider = vue.inject(configProviderInjectionKey, null);
    const mountStyle = () => {
      const clsPrefix = clsPrefixRef.value;
      style2.mount({
        id: clsPrefix === void 0 ? mountId : clsPrefix + mountId,
        head: true,
        anchorMetaName: cssrAnchorMetaName,
        props: {
          bPrefix: clsPrefix ? `.${clsPrefix}-` : void 0
        },
        ssr: ssrAdapter2
      });
      if (!(NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.preflightStyleDisabled)) {
        globalStyle.mount({
          id: "n-global",
          head: true,
          anchorMetaName: cssrAnchorMetaName,
          ssr: ssrAdapter2
        });
      }
    };
    if (ssrAdapter2) {
      mountStyle();
    } else {
      vue.onBeforeMount(mountStyle);
    }
  }
  function useThemeClass(componentName, hashRef, cssVarsRef, props) {
    var _a;
    if (!cssVarsRef)
      throwError("useThemeClass", "cssVarsRef is not passed");
    const mergedThemeHashRef = (_a = vue.inject(configProviderInjectionKey, null)) === null || _a === void 0 ? void 0 : _a.mergedThemeHashRef;
    const themeClassRef = vue.ref("");
    const ssrAdapter2 = useSsrAdapter();
    let renderCallback;
    const hashClassPrefix = `__${componentName}`;
    const mountStyle = () => {
      let finalThemeHash = hashClassPrefix;
      const hashValue = hashRef ? hashRef.value : void 0;
      const themeHash = mergedThemeHashRef === null || mergedThemeHashRef === void 0 ? void 0 : mergedThemeHashRef.value;
      if (themeHash)
        finalThemeHash += "-" + themeHash;
      if (hashValue)
        finalThemeHash += "-" + hashValue;
      const {
        themeOverrides,
        builtinThemeOverrides
      } = props;
      if (themeOverrides) {
        finalThemeHash += "-" + murmur2(JSON.stringify(themeOverrides));
      }
      if (builtinThemeOverrides) {
        finalThemeHash += "-" + murmur2(JSON.stringify(builtinThemeOverrides));
      }
      themeClassRef.value = finalThemeHash;
      renderCallback = () => {
        const cssVars = cssVarsRef.value;
        let style2 = "";
        for (const key in cssVars) {
          style2 += `${key}: ${cssVars[key]};`;
        }
        c(`.${finalThemeHash}`, style2).mount({
          id: finalThemeHash,
          ssr: ssrAdapter2
        });
        renderCallback = void 0;
      };
    };
    vue.watchEffect(() => {
      mountStyle();
    });
    return {
      themeClass: themeClassRef,
      onRender: () => {
        renderCallback === null || renderCallback === void 0 ? void 0 : renderCallback();
      }
    };
  }
  function useRtl(mountId, rtlStateRef, clsPrefixRef) {
    if (!rtlStateRef)
      return void 0;
    const ssrAdapter2 = useSsrAdapter();
    const componentRtlStateRef = vue.computed(() => {
      const {
        value: rtlState
      } = rtlStateRef;
      if (!rtlState) {
        return void 0;
      }
      const componentRtlState = rtlState[mountId];
      if (!componentRtlState) {
        return void 0;
      }
      return componentRtlState;
    });
    const mountStyle = () => {
      vue.watchEffect(() => {
        const {
          value: clsPrefix
        } = clsPrefixRef;
        const id = `${clsPrefix}${mountId}Rtl`;
        if (exists(id, ssrAdapter2))
          return;
        const {
          value: componentRtlState
        } = componentRtlStateRef;
        if (!componentRtlState)
          return;
        componentRtlState.style.mount({
          id,
          head: true,
          anchorMetaName: cssrAnchorMetaName,
          props: {
            bPrefix: clsPrefix ? `.${clsPrefix}-` : void 0
          },
          ssr: ssrAdapter2
        });
      });
    };
    if (ssrAdapter2) {
      mountStyle();
    } else {
      vue.onBeforeMount(mountStyle);
    }
    return componentRtlStateRef;
  }
  function replaceable(name, icon) {
    return vue.defineComponent({
      name: upperFirst(name),
      setup() {
        var _a;
        const mergedIconsRef = (_a = vue.inject(configProviderInjectionKey, null)) === null || _a === void 0 ? void 0 : _a.mergedIconsRef;
        return () => {
          var _a2;
          const iconOverride = (_a2 = mergedIconsRef === null || mergedIconsRef === void 0 ? void 0 : mergedIconsRef.value) === null || _a2 === void 0 ? void 0 : _a2[name];
          return iconOverride ? iconOverride() : icon;
        };
      }
    });
  }
  const ErrorIcon$1 = replaceable("close", vue.h("svg", {
    viewBox: "0 0 12 12",
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true
  }, vue.h("g", {
    stroke: "none",
    "stroke-width": "1",
    fill: "none",
    "fill-rule": "evenodd"
  }, vue.h("g", {
    fill: "currentColor",
    "fill-rule": "nonzero"
  }, vue.h("path", {
    d: "M2.08859116,2.2156945 L2.14644661,2.14644661 C2.32001296,1.97288026 2.58943736,1.95359511 2.7843055,2.08859116 L2.85355339,2.14644661 L6,5.293 L9.14644661,2.14644661 C9.34170876,1.95118446 9.65829124,1.95118446 9.85355339,2.14644661 C10.0488155,2.34170876 10.0488155,2.65829124 9.85355339,2.85355339 L6.707,6 L9.85355339,9.14644661 C10.0271197,9.32001296 10.0464049,9.58943736 9.91140884,9.7843055 L9.85355339,9.85355339 C9.67998704,10.0271197 9.41056264,10.0464049 9.2156945,9.91140884 L9.14644661,9.85355339 L6,6.707 L2.85355339,9.85355339 C2.65829124,10.0488155 2.34170876,10.0488155 2.14644661,9.85355339 C1.95118446,9.65829124 1.95118446,9.34170876 2.14644661,9.14644661 L5.293,6 L2.14644661,2.85355339 C1.97288026,2.67998704 1.95359511,2.41056264 2.08859116,2.2156945 L2.14644661,2.14644661 L2.08859116,2.2156945 Z"
  })))));
  const ErrorIcon = replaceable("error", vue.h("svg", {
    viewBox: "0 0 48 48",
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg"
  }, vue.h("g", {
    stroke: "none",
    "stroke-width": "1",
    "fill-rule": "evenodd"
  }, vue.h("g", {
    "fill-rule": "nonzero"
  }, vue.h("path", {
    d: "M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M17.8838835,16.1161165 L17.7823881,16.0249942 C17.3266086,15.6583353 16.6733914,15.6583353 16.2176119,16.0249942 L16.1161165,16.1161165 L16.0249942,16.2176119 C15.6583353,16.6733914 15.6583353,17.3266086 16.0249942,17.7823881 L16.1161165,17.8838835 L22.233,24 L16.1161165,30.1161165 L16.0249942,30.2176119 C15.6583353,30.6733914 15.6583353,31.3266086 16.0249942,31.7823881 L16.1161165,31.8838835 L16.2176119,31.9750058 C16.6733914,32.3416647 17.3266086,32.3416647 17.7823881,31.9750058 L17.8838835,31.8838835 L24,25.767 L30.1161165,31.8838835 L30.2176119,31.9750058 C30.6733914,32.3416647 31.3266086,32.3416647 31.7823881,31.9750058 L31.8838835,31.8838835 L31.9750058,31.7823881 C32.3416647,31.3266086 32.3416647,30.6733914 31.9750058,30.2176119 L31.8838835,30.1161165 L25.767,24 L31.8838835,17.8838835 L31.9750058,17.7823881 C32.3416647,17.3266086 32.3416647,16.6733914 31.9750058,16.2176119 L31.8838835,16.1161165 L31.7823881,16.0249942 C31.3266086,15.6583353 30.6733914,15.6583353 30.2176119,16.0249942 L30.1161165,16.1161165 L24,22.233 L17.8838835,16.1161165 L17.7823881,16.0249942 L17.8838835,16.1161165 Z"
  })))));
  const InfoIcon = replaceable("info", vue.h("svg", {
    viewBox: "0 0 28 28",
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg"
  }, vue.h("g", {
    stroke: "none",
    "stroke-width": "1",
    "fill-rule": "evenodd"
  }, vue.h("g", {
    "fill-rule": "nonzero"
  }, vue.h("path", {
    d: "M14,2 C20.6274,2 26,7.37258 26,14 C26,20.6274 20.6274,26 14,26 C7.37258,26 2,20.6274 2,14 C2,7.37258 7.37258,2 14,2 Z M14,11 C13.4477,11 13,11.4477 13,12 L13,12 L13,20 C13,20.5523 13.4477,21 14,21 C14.5523,21 15,20.5523 15,20 L15,20 L15,12 C15,11.4477 14.5523,11 14,11 Z M14,6.75 C13.3096,6.75 12.75,7.30964 12.75,8 C12.75,8.69036 13.3096,9.25 14,9.25 C14.6904,9.25 15.25,8.69036 15.25,8 C15.25,7.30964 14.6904,6.75 14,6.75 Z"
  })))));
  const SuccessIcon = replaceable("success", vue.h("svg", {
    viewBox: "0 0 48 48",
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg"
  }, vue.h("g", {
    stroke: "none",
    "stroke-width": "1",
    "fill-rule": "evenodd"
  }, vue.h("g", {
    "fill-rule": "nonzero"
  }, vue.h("path", {
    d: "M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z"
  })))));
  const WarningIcon = replaceable("warning", vue.h("svg", {
    viewBox: "0 0 24 24",
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg"
  }, vue.h("g", {
    stroke: "none",
    "stroke-width": "1",
    "fill-rule": "evenodd"
  }, vue.h("g", {
    "fill-rule": "nonzero"
  }, vue.h("path", {
    d: "M12,2 C17.523,2 22,6.478 22,12 C22,17.522 17.523,22 12,22 C6.477,22 2,17.522 2,12 C2,6.478 6.477,2 12,2 Z M12.0018002,15.0037242 C11.450254,15.0037242 11.0031376,15.4508407 11.0031376,16.0023869 C11.0031376,16.553933 11.450254,17.0010495 12.0018002,17.0010495 C12.5533463,17.0010495 13.0004628,16.553933 13.0004628,16.0023869 C13.0004628,15.4508407 12.5533463,15.0037242 12.0018002,15.0037242 Z M11.99964,7 C11.4868042,7.00018474 11.0642719,7.38637706 11.0066858,7.8837365 L11,8.00036004 L11.0018003,13.0012393 L11.00857,13.117858 C11.0665141,13.6151758 11.4893244,14.0010638 12.0021602,14.0008793 C12.514996,14.0006946 12.9375283,13.6145023 12.9951144,13.1171428 L13.0018002,13.0005193 L13,7.99964009 L12.9932303,7.8830214 C12.9352861,7.38570354 12.5124758,6.99981552 11.99964,7 Z"
  })))));
  const NIconSwitchTransition = vue.defineComponent({
    name: "BaseIconSwitchTransition",
    setup(_, {
      slots
    }) {
      const isMountedRef = isMounted();
      return () => vue.h(vue.Transition, {
        name: "icon-switch-transition",
        appear: isMountedRef.value
      }, slots);
    }
  });
  const NFadeInExpandTransition = vue.defineComponent({
    name: "FadeInExpandTransition",
    props: {
      appear: Boolean,
      group: Boolean,
      mode: String,
      onLeave: Function,
      onAfterLeave: Function,
      onAfterEnter: Function,
      width: Boolean,
      // reverse mode is only used in tree
      // it make it from expanded to collapsed after mounted
      reverse: Boolean
    },
    setup(props, {
      slots
    }) {
      function handleBeforeLeave(el) {
        if (props.width) {
          el.style.maxWidth = `${el.offsetWidth}px`;
        } else {
          el.style.maxHeight = `${el.offsetHeight}px`;
        }
        void el.offsetWidth;
      }
      function handleLeave(el) {
        if (props.width) {
          el.style.maxWidth = "0";
        } else {
          el.style.maxHeight = "0";
        }
        void el.offsetWidth;
        const {
          onLeave
        } = props;
        if (onLeave)
          onLeave();
      }
      function handleAfterLeave(el) {
        if (props.width) {
          el.style.maxWidth = "";
        } else {
          el.style.maxHeight = "";
        }
        const {
          onAfterLeave
        } = props;
        if (onAfterLeave)
          onAfterLeave();
      }
      function handleEnter(el) {
        el.style.transition = "none";
        if (props.width) {
          const memorizedWidth = el.offsetWidth;
          el.style.maxWidth = "0";
          void el.offsetWidth;
          el.style.transition = "";
          el.style.maxWidth = `${memorizedWidth}px`;
        } else {
          if (props.reverse) {
            el.style.maxHeight = `${el.offsetHeight}px`;
            void el.offsetHeight;
            el.style.transition = "";
            el.style.maxHeight = "0";
          } else {
            const memorizedHeight = el.offsetHeight;
            el.style.maxHeight = "0";
            void el.offsetWidth;
            el.style.transition = "";
            el.style.maxHeight = `${memorizedHeight}px`;
          }
        }
        void el.offsetWidth;
      }
      function handleAfterEnter(el) {
        var _a;
        if (props.width) {
          el.style.maxWidth = "";
        } else {
          if (!props.reverse) {
            el.style.maxHeight = "";
          }
        }
        (_a = props.onAfterEnter) === null || _a === void 0 ? void 0 : _a.call(props);
      }
      return () => {
        const {
          group,
          width,
          appear,
          mode
        } = props;
        const type2 = group ? vue.TransitionGroup : vue.Transition;
        const resolvedProps = {
          name: width ? "fade-in-width-expand-transition" : "fade-in-height-expand-transition",
          appear,
          onEnter: handleEnter,
          onAfterEnter: handleAfterEnter,
          onBeforeLeave: handleBeforeLeave,
          onLeave: handleLeave,
          onAfterLeave: handleAfterLeave
        };
        if (!group) {
          resolvedProps.mode = mode;
        }
        return vue.h(type2, resolvedProps, slots);
      };
    }
  });
  const style$a = cB("base-icon", `
 height: 1em;
 width: 1em;
 line-height: 1em;
 text-align: center;
 display: inline-block;
 position: relative;
 fill: currentColor;
 transform: translateZ(0);
`, [c("svg", `
 height: 1em;
 width: 1em;
 `)]);
  const NBaseIcon = vue.defineComponent({
    name: "BaseIcon",
    props: {
      role: String,
      ariaLabel: String,
      ariaDisabled: {
        type: Boolean,
        default: void 0
      },
      ariaHidden: {
        type: Boolean,
        default: void 0
      },
      clsPrefix: {
        type: String,
        required: true
      },
      onClick: Function,
      onMousedown: Function,
      onMouseup: Function
    },
    setup(props) {
      useStyle("-base-icon", style$a, vue.toRef(props, "clsPrefix"));
    },
    render() {
      return vue.h("i", {
        class: `${this.clsPrefix}-base-icon`,
        onClick: this.onClick,
        onMousedown: this.onMousedown,
        onMouseup: this.onMouseup,
        role: this.role,
        "aria-label": this.ariaLabel,
        "aria-hidden": this.ariaHidden,
        "aria-disabled": this.ariaDisabled
      }, this.$slots);
    }
  });
  const style$9 = cB("base-close", `
 display: flex;
 align-items: center;
 justify-content: center;
 cursor: pointer;
 background-color: transparent;
 color: var(--n-close-icon-color);
 border-radius: var(--n-close-border-radius);
 height: var(--n-close-size);
 width: var(--n-close-size);
 font-size: var(--n-close-icon-size);
 outline: none;
 border: none;
 position: relative;
 padding: 0;
`, [cM("absolute", `
 height: var(--n-close-icon-size);
 width: var(--n-close-icon-size);
 `), c("&::before", `
 content: "";
 position: absolute;
 width: var(--n-close-size);
 height: var(--n-close-size);
 left: 50%;
 top: 50%;
 transform: translateY(-50%) translateX(-50%);
 transition: inherit;
 border-radius: inherit;
 `), cNotM("disabled", [c("&:hover", `
 color: var(--n-close-icon-color-hover);
 `), c("&:hover::before", `
 background-color: var(--n-close-color-hover);
 `), c("&:focus::before", `
 background-color: var(--n-close-color-hover);
 `), c("&:active", `
 color: var(--n-close-icon-color-pressed);
 `), c("&:active::before", `
 background-color: var(--n-close-color-pressed);
 `)]), cM("disabled", `
 cursor: not-allowed;
 color: var(--n-close-icon-color-disabled);
 background-color: transparent;
 `), cM("round", [c("&::before", `
 border-radius: 50%;
 `)])]);
  const NBaseClose = vue.defineComponent({
    name: "BaseClose",
    props: {
      isButtonTag: {
        type: Boolean,
        default: true
      },
      clsPrefix: {
        type: String,
        required: true
      },
      disabled: {
        type: Boolean,
        default: void 0
      },
      focusable: {
        type: Boolean,
        default: true
      },
      round: Boolean,
      onClick: Function,
      absolute: Boolean
    },
    setup(props) {
      useStyle("-base-close", style$9, vue.toRef(props, "clsPrefix"));
      return () => {
        const {
          clsPrefix,
          disabled,
          absolute,
          round,
          isButtonTag
        } = props;
        const Tag = isButtonTag ? "button" : "div";
        return vue.h(Tag, {
          type: isButtonTag ? "button" : void 0,
          tabindex: disabled || !props.focusable ? -1 : 0,
          "aria-disabled": disabled,
          "aria-label": "close",
          role: isButtonTag ? void 0 : "button",
          disabled,
          class: [`${clsPrefix}-base-close`, absolute && `${clsPrefix}-base-close--absolute`, disabled && `${clsPrefix}-base-close--disabled`, round && `${clsPrefix}-base-close--round`],
          onMousedown: (e2) => {
            if (!props.focusable) {
              e2.preventDefault();
            }
          },
          onClick: props.onClick
        }, vue.h(NBaseIcon, {
          clsPrefix
        }, {
          default: () => vue.h(ErrorIcon$1, null)
        }));
      };
    }
  });
  const {
    cubicBezierEaseInOut: cubicBezierEaseInOut$2
  } = commonVariables$2;
  function iconSwitchTransition({
    originalTransform = "",
    left = 0,
    top = 0,
    transition = `all .3s ${cubicBezierEaseInOut$2} !important`
  } = {}) {
    return [c("&.icon-switch-transition-enter-from, &.icon-switch-transition-leave-to", {
      transform: originalTransform + " scale(0.75)",
      left,
      top,
      opacity: 0
    }), c("&.icon-switch-transition-enter-to, &.icon-switch-transition-leave-from", {
      transform: `scale(1) ${originalTransform}`,
      left,
      top,
      opacity: 1
    }), c("&.icon-switch-transition-enter-active, &.icon-switch-transition-leave-active", {
      transformOrigin: "center",
      position: "absolute",
      left,
      top,
      transition
    })];
  }
  const style$8 = c([c("@keyframes rotator", `
 0% {
 -webkit-transform: rotate(0deg);
 transform: rotate(0deg);
 }
 100% {
 -webkit-transform: rotate(360deg);
 transform: rotate(360deg);
 }`), cB("base-loading", `
 position: relative;
 line-height: 0;
 width: 1em;
 height: 1em;
 `, [cE("transition-wrapper", `
 position: absolute;
 width: 100%;
 height: 100%;
 `, [iconSwitchTransition()]), cE("placeholder", `
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 `, [iconSwitchTransition({
    left: "50%",
    top: "50%",
    originalTransform: "translateX(-50%) translateY(-50%)"
  })]), cE("container", `
 animation: rotator 3s linear infinite both;
 `, [cE("icon", `
 height: 1em;
 width: 1em;
 `)])])]);
  const duration = "1.6s";
  const exposedLoadingProps = {
    strokeWidth: {
      type: Number,
      default: 28
    },
    stroke: {
      type: String,
      default: void 0
    }
  };
  const NBaseLoading = vue.defineComponent({
    name: "BaseLoading",
    props: Object.assign({
      clsPrefix: {
        type: String,
        required: true
      },
      show: {
        type: Boolean,
        default: true
      },
      scale: {
        type: Number,
        default: 1
      },
      radius: {
        type: Number,
        default: 100
      }
    }, exposedLoadingProps),
    setup(props) {
      useStyle("-base-loading", style$8, vue.toRef(props, "clsPrefix"));
    },
    render() {
      const {
        clsPrefix,
        radius,
        strokeWidth,
        stroke,
        scale
      } = this;
      const scaledRadius = radius / scale;
      return vue.h("div", {
        class: `${clsPrefix}-base-loading`,
        role: "img",
        "aria-label": "loading"
      }, vue.h(NIconSwitchTransition, null, {
        default: () => this.show ? vue.h("div", {
          key: "icon",
          class: `${clsPrefix}-base-loading__transition-wrapper`
        }, vue.h("div", {
          class: `${clsPrefix}-base-loading__container`
        }, vue.h("svg", {
          class: `${clsPrefix}-base-loading__icon`,
          viewBox: `0 0 ${2 * scaledRadius} ${2 * scaledRadius}`,
          xmlns: "http://www.w3.org/2000/svg",
          style: {
            color: stroke
          }
        }, vue.h("g", null, vue.h("animateTransform", {
          attributeName: "transform",
          type: "rotate",
          values: `0 ${scaledRadius} ${scaledRadius};270 ${scaledRadius} ${scaledRadius}`,
          begin: "0s",
          dur: duration,
          fill: "freeze",
          repeatCount: "indefinite"
        }), vue.h("circle", {
          class: `${clsPrefix}-base-loading__icon`,
          fill: "none",
          stroke: "currentColor",
          "stroke-width": strokeWidth,
          "stroke-linecap": "round",
          cx: scaledRadius,
          cy: scaledRadius,
          r: radius - strokeWidth / 2,
          "stroke-dasharray": 5.67 * radius,
          "stroke-dashoffset": 18.48 * radius
        }, vue.h("animateTransform", {
          attributeName: "transform",
          type: "rotate",
          values: `0 ${scaledRadius} ${scaledRadius};135 ${scaledRadius} ${scaledRadius};450 ${scaledRadius} ${scaledRadius}`,
          begin: "0s",
          dur: duration,
          fill: "freeze",
          repeatCount: "indefinite"
        }), vue.h("animate", {
          attributeName: "stroke-dashoffset",
          values: `${5.67 * radius};${1.42 * radius};${5.67 * radius}`,
          begin: "0s",
          dur: duration,
          fill: "freeze",
          repeatCount: "indefinite"
        })))))) : vue.h("div", {
          key: "placeholder",
          class: `${clsPrefix}-base-loading__placeholder`
        }, this.$slots)
      }));
    }
  });
  const base = {
    neutralBase: "#FFF",
    neutralInvertBase: "#000",
    neutralTextBase: "#000",
    neutralPopover: "#fff",
    neutralCard: "#fff",
    neutralModal: "#fff",
    neutralBody: "#fff",
    alpha1: "0.82",
    alpha2: "0.72",
    alpha3: "0.38",
    alpha4: "0.24",
    // disabled text, placeholder, icon
    alpha5: "0.18",
    // disabled placeholder
    alphaClose: "0.6",
    alphaDisabled: "0.5",
    alphaDisabledInput: "0.02",
    alphaPending: "0.05",
    alphaTablePending: "0.02",
    alphaPressed: "0.07",
    alphaAvatar: "0.2",
    alphaRail: "0.14",
    alphaProgressRail: ".08",
    alphaBorder: "0.12",
    alphaDivider: "0.06",
    alphaInput: "0",
    alphaAction: "0.02",
    alphaTab: "0.04",
    alphaScrollbar: "0.25",
    alphaScrollbarHover: "0.4",
    alphaCode: "0.05",
    alphaTag: "0.02",
    // primary
    primaryHover: "#36ad6a",
    primaryDefault: "#18a058",
    primaryActive: "#0c7a43",
    primarySuppl: "#36ad6a",
    // info
    infoHover: "#4098fc",
    infoDefault: "#2080f0",
    infoActive: "#1060c9",
    infoSuppl: "#4098fc",
    // error
    errorHover: "#de576d",
    errorDefault: "#d03050",
    errorActive: "#ab1f3f",
    errorSuppl: "#de576d",
    // warning
    warningHover: "#fcb040",
    warningDefault: "#f0a020",
    warningActive: "#c97c10",
    warningSuppl: "#fcb040",
    // success
    successHover: "#36ad6a",
    successDefault: "#18a058",
    successActive: "#0c7a43",
    successSuppl: "#36ad6a"
  };
  const baseBackgroundRgb = rgba(base.neutralBase);
  const baseInvertBackgroundRgb = rgba(base.neutralInvertBase);
  const overlayPrefix = "rgba(" + baseInvertBackgroundRgb.slice(0, 3).join(", ") + ", ";
  function overlay(alpha) {
    return overlayPrefix + String(alpha) + ")";
  }
  function neutral(alpha) {
    const overlayRgba = Array.from(baseInvertBackgroundRgb);
    overlayRgba[3] = Number(alpha);
    return composite(baseBackgroundRgb, overlayRgba);
  }
  const derived = Object.assign(Object.assign({
    name: "common"
  }, commonVariables$2), {
    baseColor: base.neutralBase,
    // primary color
    primaryColor: base.primaryDefault,
    primaryColorHover: base.primaryHover,
    primaryColorPressed: base.primaryActive,
    primaryColorSuppl: base.primarySuppl,
    // info color
    infoColor: base.infoDefault,
    infoColorHover: base.infoHover,
    infoColorPressed: base.infoActive,
    infoColorSuppl: base.infoSuppl,
    // success color
    successColor: base.successDefault,
    successColorHover: base.successHover,
    successColorPressed: base.successActive,
    successColorSuppl: base.successSuppl,
    // warning color
    warningColor: base.warningDefault,
    warningColorHover: base.warningHover,
    warningColorPressed: base.warningActive,
    warningColorSuppl: base.warningSuppl,
    // error color
    errorColor: base.errorDefault,
    errorColorHover: base.errorHover,
    errorColorPressed: base.errorActive,
    errorColorSuppl: base.errorSuppl,
    // text color
    textColorBase: base.neutralTextBase,
    textColor1: "rgb(31, 34, 37)",
    textColor2: "rgb(51, 54, 57)",
    textColor3: "rgb(118, 124, 130)",
    // textColor4: neutral(base.alpha4), // disabled, placeholder, icon
    // textColor5: neutral(base.alpha5),
    textColorDisabled: neutral(base.alpha4),
    placeholderColor: neutral(base.alpha4),
    placeholderColorDisabled: neutral(base.alpha5),
    iconColor: neutral(base.alpha4),
    iconColorHover: scaleColor(neutral(base.alpha4), {
      lightness: 0.75
    }),
    iconColorPressed: scaleColor(neutral(base.alpha4), {
      lightness: 0.9
    }),
    iconColorDisabled: neutral(base.alpha5),
    opacity1: base.alpha1,
    opacity2: base.alpha2,
    opacity3: base.alpha3,
    opacity4: base.alpha4,
    opacity5: base.alpha5,
    dividerColor: "rgb(239, 239, 245)",
    borderColor: "rgb(224, 224, 230)",
    // close
    closeIconColor: neutral(Number(base.alphaClose)),
    closeIconColorHover: neutral(Number(base.alphaClose)),
    closeIconColorPressed: neutral(Number(base.alphaClose)),
    closeColorHover: "rgba(0, 0, 0, .09)",
    closeColorPressed: "rgba(0, 0, 0, .13)",
    // clear
    clearColor: neutral(base.alpha4),
    clearColorHover: scaleColor(neutral(base.alpha4), {
      lightness: 0.75
    }),
    clearColorPressed: scaleColor(neutral(base.alpha4), {
      lightness: 0.9
    }),
    scrollbarColor: overlay(base.alphaScrollbar),
    scrollbarColorHover: overlay(base.alphaScrollbarHover),
    scrollbarWidth: "5px",
    scrollbarHeight: "5px",
    scrollbarBorderRadius: "5px",
    progressRailColor: neutral(base.alphaProgressRail),
    railColor: "rgb(219, 219, 223)",
    popoverColor: base.neutralPopover,
    tableColor: base.neutralCard,
    cardColor: base.neutralCard,
    modalColor: base.neutralModal,
    bodyColor: base.neutralBody,
    tagColor: "#eee",
    avatarColor: neutral(base.alphaAvatar),
    invertedColor: "rgb(0, 20, 40)",
    inputColor: neutral(base.alphaInput),
    codeColor: "rgb(244, 244, 248)",
    tabColor: "rgb(247, 247, 250)",
    actionColor: "rgb(250, 250, 252)",
    tableHeaderColor: "rgb(250, 250, 252)",
    hoverColor: "rgb(243, 243, 245)",
    // use color with alpha since it can be nested with header filter & sorter effect
    tableColorHover: "rgba(0, 0, 100, 0.03)",
    tableColorStriped: "rgba(0, 0, 100, 0.02)",
    pressedColor: "rgb(237, 237, 239)",
    opacityDisabled: base.alphaDisabled,
    inputColorDisabled: "rgb(250, 250, 252)",
    // secondary button color
    // can also be used in tertiary button & quaternary button
    buttonColor2: "rgba(46, 51, 56, .05)",
    buttonColor2Hover: "rgba(46, 51, 56, .09)",
    buttonColor2Pressed: "rgba(46, 51, 56, .13)",
    boxShadow1: "0 1px 2px -2px rgba(0, 0, 0, .08), 0 3px 6px 0 rgba(0, 0, 0, .06), 0 5px 12px 4px rgba(0, 0, 0, .04)",
    boxShadow2: "0 3px 6px -4px rgba(0, 0, 0, .12), 0 6px 16px 0 rgba(0, 0, 0, .08), 0 9px 28px 8px rgba(0, 0, 0, .05)",
    boxShadow3: "0 6px 16px -9px rgba(0, 0, 0, .08), 0 9px 28px 0 rgba(0, 0, 0, .05), 0 12px 48px 16px rgba(0, 0, 0, .03)"
  });
  const commonLight = derived;
  const self$7 = (vars) => {
    const {
      scrollbarColor,
      scrollbarColorHover
    } = vars;
    return {
      color: scrollbarColor,
      colorHover: scrollbarColorHover
    };
  };
  const scrollbarLight = {
    name: "Scrollbar",
    common: commonLight,
    self: self$7
  };
  const scrollbarLight$1 = scrollbarLight;
  const {
    cubicBezierEaseInOut: cubicBezierEaseInOut$1
  } = commonVariables$2;
  function fadeInTransition({
    name = "fade-in",
    enterDuration = "0.2s",
    leaveDuration = "0.2s",
    enterCubicBezier = cubicBezierEaseInOut$1,
    leaveCubicBezier = cubicBezierEaseInOut$1
  } = {}) {
    return [c(`&.${name}-transition-enter-active`, {
      transition: `all ${enterDuration} ${enterCubicBezier}!important`
    }), c(`&.${name}-transition-leave-active`, {
      transition: `all ${leaveDuration} ${leaveCubicBezier}!important`
    }), c(`&.${name}-transition-enter-from, &.${name}-transition-leave-to`, {
      opacity: 0
    }), c(`&.${name}-transition-leave-from, &.${name}-transition-enter-to`, {
      opacity: 1
    })];
  }
  const style$7 = cB("scrollbar", `
 overflow: hidden;
 position: relative;
 z-index: auto;
 height: 100%;
 width: 100%;
`, [c(">", [cB("scrollbar-container", `
 width: 100%;
 overflow: scroll;
 height: 100%;
 min-height: inherit;
 max-height: inherit;
 scrollbar-width: none;
 `, [c("&::-webkit-scrollbar, &::-webkit-scrollbar-track-piece, &::-webkit-scrollbar-thumb", `
 width: 0;
 height: 0;
 display: none;
 `), c(">", [cB("scrollbar-content", `
 box-sizing: border-box;
 min-width: 100%;
 `)])])]), c(">, +", [cB("scrollbar-rail", `
 position: absolute;
 pointer-events: none;
 user-select: none;
 -webkit-user-select: none;
 `, [cM("horizontal", `
 left: 2px;
 right: 2px;
 bottom: 4px;
 height: var(--n-scrollbar-height);
 `, [c(">", [cE("scrollbar", `
 height: var(--n-scrollbar-height);
 border-radius: var(--n-scrollbar-border-radius);
 right: 0;
 `)])]), cM("vertical", `
 right: 4px;
 top: 2px;
 bottom: 2px;
 width: var(--n-scrollbar-width);
 `, [c(">", [cE("scrollbar", `
 width: var(--n-scrollbar-width);
 border-radius: var(--n-scrollbar-border-radius);
 bottom: 0;
 `)])]), cM("disabled", [c(">", [cE("scrollbar", "pointer-events: none;")])]), c(">", [cE("scrollbar", `
 z-index: 1;
 position: absolute;
 cursor: pointer;
 pointer-events: all;
 background-color: var(--n-scrollbar-color);
 transition: background-color .2s var(--n-scrollbar-bezier);
 `, [fadeInTransition(), c("&:hover", "background-color: var(--n-scrollbar-color-hover);")])])])])]);
  const scrollbarProps = Object.assign(Object.assign({}, useTheme.props), {
    size: {
      type: Number,
      default: 5
    },
    duration: {
      type: Number,
      default: 0
    },
    scrollable: {
      type: Boolean,
      default: true
    },
    xScrollable: Boolean,
    trigger: {
      type: String,
      default: "hover"
    },
    useUnifiedContainer: Boolean,
    triggerDisplayManually: Boolean,
    // If container is set, resize observer won't not attached
    container: Function,
    content: Function,
    containerClass: String,
    containerStyle: [String, Object],
    contentClass: [String, Array],
    contentStyle: [String, Object],
    horizontalRailStyle: [String, Object],
    verticalRailStyle: [String, Object],
    onScroll: Function,
    onWheel: Function,
    onResize: Function,
    internalOnUpdateScrollLeft: Function,
    internalHoistYRail: Boolean
  });
  const Scrollbar = vue.defineComponent({
    name: "Scrollbar",
    props: scrollbarProps,
    inheritAttrs: false,
    setup(props) {
      const {
        mergedClsPrefixRef,
        inlineThemeDisabled,
        mergedRtlRef
      } = useConfig(props);
      const rtlEnabledRef = useRtl("Scrollbar", mergedRtlRef, mergedClsPrefixRef);
      const wrapperRef = vue.ref(null);
      const containerRef = vue.ref(null);
      const contentRef = vue.ref(null);
      const yRailRef = vue.ref(null);
      const xRailRef = vue.ref(null);
      const contentHeightRef = vue.ref(null);
      const contentWidthRef = vue.ref(null);
      const containerHeightRef = vue.ref(null);
      const containerWidthRef = vue.ref(null);
      const yRailSizeRef = vue.ref(null);
      const xRailSizeRef = vue.ref(null);
      const containerScrollTopRef = vue.ref(0);
      const containerScrollLeftRef = vue.ref(0);
      const isShowXBarRef = vue.ref(false);
      const isShowYBarRef = vue.ref(false);
      let yBarPressed = false;
      let xBarPressed = false;
      let xBarVanishTimerId;
      let yBarVanishTimerId;
      let memoYTop = 0;
      let memoXLeft = 0;
      let memoMouseX = 0;
      let memoMouseY = 0;
      const isIos2 = useIsIos();
      const yBarSizeRef = vue.computed(() => {
        const {
          value: containerHeight
        } = containerHeightRef;
        const {
          value: contentHeight
        } = contentHeightRef;
        const {
          value: yRailSize
        } = yRailSizeRef;
        if (containerHeight === null || contentHeight === null || yRailSize === null) {
          return 0;
        } else {
          return Math.min(containerHeight, yRailSize * containerHeight / contentHeight + props.size * 1.5);
        }
      });
      const yBarSizePxRef = vue.computed(() => {
        return `${yBarSizeRef.value}px`;
      });
      const xBarSizeRef = vue.computed(() => {
        const {
          value: containerWidth
        } = containerWidthRef;
        const {
          value: contentWidth
        } = contentWidthRef;
        const {
          value: xRailSize
        } = xRailSizeRef;
        if (containerWidth === null || contentWidth === null || xRailSize === null) {
          return 0;
        } else {
          return xRailSize * containerWidth / contentWidth + props.size * 1.5;
        }
      });
      const xBarSizePxRef = vue.computed(() => {
        return `${xBarSizeRef.value}px`;
      });
      const yBarTopRef = vue.computed(() => {
        const {
          value: containerHeight
        } = containerHeightRef;
        const {
          value: containerScrollTop
        } = containerScrollTopRef;
        const {
          value: contentHeight
        } = contentHeightRef;
        const {
          value: yRailSize
        } = yRailSizeRef;
        if (containerHeight === null || contentHeight === null || yRailSize === null) {
          return 0;
        } else {
          const heightDiff = contentHeight - containerHeight;
          if (!heightDiff)
            return 0;
          return containerScrollTop / heightDiff * (yRailSize - yBarSizeRef.value);
        }
      });
      const yBarTopPxRef = vue.computed(() => {
        return `${yBarTopRef.value}px`;
      });
      const xBarLeftRef = vue.computed(() => {
        const {
          value: containerWidth
        } = containerWidthRef;
        const {
          value: containerScrollLeft
        } = containerScrollLeftRef;
        const {
          value: contentWidth
        } = contentWidthRef;
        const {
          value: xRailSize
        } = xRailSizeRef;
        if (containerWidth === null || contentWidth === null || xRailSize === null) {
          return 0;
        } else {
          const widthDiff = contentWidth - containerWidth;
          if (!widthDiff)
            return 0;
          return containerScrollLeft / widthDiff * (xRailSize - xBarSizeRef.value);
        }
      });
      const xBarLeftPxRef = vue.computed(() => {
        return `${xBarLeftRef.value}px`;
      });
      const needYBarRef = vue.computed(() => {
        const {
          value: containerHeight
        } = containerHeightRef;
        const {
          value: contentHeight
        } = contentHeightRef;
        return containerHeight !== null && contentHeight !== null && contentHeight > containerHeight;
      });
      const needXBarRef = vue.computed(() => {
        const {
          value: containerWidth
        } = containerWidthRef;
        const {
          value: contentWidth
        } = contentWidthRef;
        return containerWidth !== null && contentWidth !== null && contentWidth > containerWidth;
      });
      const mergedShowXBarRef = vue.computed(() => {
        const {
          trigger: trigger2
        } = props;
        return trigger2 === "none" || isShowXBarRef.value;
      });
      const mergedShowYBarRef = vue.computed(() => {
        const {
          trigger: trigger2
        } = props;
        return trigger2 === "none" || isShowYBarRef.value;
      });
      const mergedContainerRef = vue.computed(() => {
        const {
          container
        } = props;
        if (container)
          return container();
        return containerRef.value;
      });
      const mergedContentRef = vue.computed(() => {
        const {
          content
        } = props;
        if (content)
          return content();
        return contentRef.value;
      });
      const activateState = useReactivated(() => {
        if (!props.container) {
          scrollTo({
            top: containerScrollTopRef.value,
            left: containerScrollLeftRef.value
          });
        }
      });
      const handleContentResize = () => {
        if (activateState.isDeactivated)
          return;
        sync();
      };
      const handleContainerResize = (e2) => {
        if (activateState.isDeactivated)
          return;
        const {
          onResize
        } = props;
        if (onResize)
          onResize(e2);
        sync();
      };
      const scrollTo = (options, y) => {
        if (!props.scrollable)
          return;
        if (typeof options === "number") {
          scrollToPosition(options, y !== null && y !== void 0 ? y : 0, 0, false, "auto");
          return;
        }
        const {
          left,
          top,
          index,
          elSize,
          position,
          behavior,
          el,
          debounce = true
        } = options;
        if (left !== void 0 || top !== void 0) {
          scrollToPosition(left !== null && left !== void 0 ? left : 0, top !== null && top !== void 0 ? top : 0, 0, false, behavior);
        }
        if (el !== void 0) {
          scrollToPosition(0, el.offsetTop, el.offsetHeight, debounce, behavior);
        } else if (index !== void 0 && elSize !== void 0) {
          scrollToPosition(0, index * elSize, elSize, debounce, behavior);
        } else if (position === "bottom") {
          scrollToPosition(0, Number.MAX_SAFE_INTEGER, 0, false, behavior);
        } else if (position === "top") {
          scrollToPosition(0, 0, 0, false, behavior);
        }
      };
      const scrollBy = (options, y) => {
        if (!props.scrollable)
          return;
        const {
          value: container
        } = mergedContainerRef;
        if (!container)
          return;
        if (typeof options === "object") {
          container.scrollBy(options);
        } else {
          container.scrollBy(options, y || 0);
        }
      };
      function scrollToPosition(left, top, elSize, debounce, behavior) {
        const {
          value: container
        } = mergedContainerRef;
        if (!container)
          return;
        if (debounce) {
          const {
            scrollTop,
            offsetHeight
          } = container;
          if (top > scrollTop) {
            if (top + elSize <= scrollTop + offsetHeight)
              ;
            else {
              container.scrollTo({
                left,
                top: top + elSize - offsetHeight,
                behavior
              });
            }
            return;
          }
        }
        container.scrollTo({
          left,
          top,
          behavior
        });
      }
      function handleMouseEnterWrapper() {
        showXBar();
        showYBar();
        sync();
      }
      function handleMouseLeaveWrapper() {
        hideBar();
      }
      function hideBar() {
        hideYBar();
        hideXBar();
      }
      function hideYBar() {
        if (yBarVanishTimerId !== void 0) {
          window.clearTimeout(yBarVanishTimerId);
        }
        yBarVanishTimerId = window.setTimeout(() => {
          isShowYBarRef.value = false;
        }, props.duration);
      }
      function hideXBar() {
        if (xBarVanishTimerId !== void 0) {
          window.clearTimeout(xBarVanishTimerId);
        }
        xBarVanishTimerId = window.setTimeout(() => {
          isShowXBarRef.value = false;
        }, props.duration);
      }
      function showXBar() {
        if (xBarVanishTimerId !== void 0) {
          window.clearTimeout(xBarVanishTimerId);
        }
        isShowXBarRef.value = true;
      }
      function showYBar() {
        if (yBarVanishTimerId !== void 0) {
          window.clearTimeout(yBarVanishTimerId);
        }
        isShowYBarRef.value = true;
      }
      function handleScroll(e2) {
        const {
          onScroll
        } = props;
        if (onScroll)
          onScroll(e2);
        syncScrollState();
      }
      function syncScrollState() {
        const {
          value: container
        } = mergedContainerRef;
        if (container) {
          containerScrollTopRef.value = container.scrollTop;
          containerScrollLeftRef.value = container.scrollLeft * ((rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? -1 : 1);
        }
      }
      function syncPositionState() {
        const {
          value: content
        } = mergedContentRef;
        if (content) {
          contentHeightRef.value = content.offsetHeight;
          contentWidthRef.value = content.offsetWidth;
        }
        const {
          value: container
        } = mergedContainerRef;
        if (container) {
          containerHeightRef.value = container.offsetHeight;
          containerWidthRef.value = container.offsetWidth;
        }
        const {
          value: xRailEl
        } = xRailRef;
        const {
          value: yRailEl
        } = yRailRef;
        if (xRailEl) {
          xRailSizeRef.value = xRailEl.offsetWidth;
        }
        if (yRailEl) {
          yRailSizeRef.value = yRailEl.offsetHeight;
        }
      }
      function syncUnifiedContainer() {
        const {
          value: container
        } = mergedContainerRef;
        if (container) {
          containerScrollTopRef.value = container.scrollTop;
          containerScrollLeftRef.value = container.scrollLeft * ((rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? -1 : 1);
          containerHeightRef.value = container.offsetHeight;
          containerWidthRef.value = container.offsetWidth;
          contentHeightRef.value = container.scrollHeight;
          contentWidthRef.value = container.scrollWidth;
        }
        const {
          value: xRailEl
        } = xRailRef;
        const {
          value: yRailEl
        } = yRailRef;
        if (xRailEl) {
          xRailSizeRef.value = xRailEl.offsetWidth;
        }
        if (yRailEl) {
          yRailSizeRef.value = yRailEl.offsetHeight;
        }
      }
      function sync() {
        if (!props.scrollable)
          return;
        if (props.useUnifiedContainer) {
          syncUnifiedContainer();
        } else {
          syncPositionState();
          syncScrollState();
        }
      }
      function isMouseUpAway(e2) {
        var _a;
        return !((_a = wrapperRef.value) === null || _a === void 0 ? void 0 : _a.contains(getPreciseEventTarget(e2)));
      }
      function handleXScrollMouseDown(e2) {
        e2.preventDefault();
        e2.stopPropagation();
        xBarPressed = true;
        on("mousemove", window, handleXScrollMouseMove, true);
        on("mouseup", window, handleXScrollMouseUp, true);
        memoXLeft = containerScrollLeftRef.value;
        memoMouseX = (rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? window.innerWidth - e2.clientX : e2.clientX;
      }
      function handleXScrollMouseMove(e2) {
        if (!xBarPressed)
          return;
        if (xBarVanishTimerId !== void 0) {
          window.clearTimeout(xBarVanishTimerId);
        }
        if (yBarVanishTimerId !== void 0) {
          window.clearTimeout(yBarVanishTimerId);
        }
        const {
          value: containerWidth
        } = containerWidthRef;
        const {
          value: contentWidth
        } = contentWidthRef;
        const {
          value: xBarSize
        } = xBarSizeRef;
        if (containerWidth === null || contentWidth === null)
          return;
        const dX = (rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? window.innerWidth - e2.clientX - memoMouseX : e2.clientX - memoMouseX;
        const dScrollLeft = dX * (contentWidth - containerWidth) / (containerWidth - xBarSize);
        const toScrollLeftUpperBound = contentWidth - containerWidth;
        let toScrollLeft = memoXLeft + dScrollLeft;
        toScrollLeft = Math.min(toScrollLeftUpperBound, toScrollLeft);
        toScrollLeft = Math.max(toScrollLeft, 0);
        const {
          value: container
        } = mergedContainerRef;
        if (container) {
          container.scrollLeft = toScrollLeft * ((rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? -1 : 1);
          const {
            internalOnUpdateScrollLeft
          } = props;
          if (internalOnUpdateScrollLeft)
            internalOnUpdateScrollLeft(toScrollLeft);
        }
      }
      function handleXScrollMouseUp(e2) {
        e2.preventDefault();
        e2.stopPropagation();
        off("mousemove", window, handleXScrollMouseMove, true);
        off("mouseup", window, handleXScrollMouseUp, true);
        xBarPressed = false;
        sync();
        if (isMouseUpAway(e2)) {
          hideBar();
        }
      }
      function handleYScrollMouseDown(e2) {
        e2.preventDefault();
        e2.stopPropagation();
        yBarPressed = true;
        on("mousemove", window, handleYScrollMouseMove, true);
        on("mouseup", window, handleYScrollMouseUp, true);
        memoYTop = containerScrollTopRef.value;
        memoMouseY = e2.clientY;
      }
      function handleYScrollMouseMove(e2) {
        if (!yBarPressed)
          return;
        if (xBarVanishTimerId !== void 0) {
          window.clearTimeout(xBarVanishTimerId);
        }
        if (yBarVanishTimerId !== void 0) {
          window.clearTimeout(yBarVanishTimerId);
        }
        const {
          value: containerHeight
        } = containerHeightRef;
        const {
          value: contentHeight
        } = contentHeightRef;
        const {
          value: yBarSize
        } = yBarSizeRef;
        if (containerHeight === null || contentHeight === null)
          return;
        const dY = e2.clientY - memoMouseY;
        const dScrollTop = dY * (contentHeight - containerHeight) / (containerHeight - yBarSize);
        const toScrollTopUpperBound = contentHeight - containerHeight;
        let toScrollTop = memoYTop + dScrollTop;
        toScrollTop = Math.min(toScrollTopUpperBound, toScrollTop);
        toScrollTop = Math.max(toScrollTop, 0);
        const {
          value: container
        } = mergedContainerRef;
        if (container) {
          container.scrollTop = toScrollTop;
        }
      }
      function handleYScrollMouseUp(e2) {
        e2.preventDefault();
        e2.stopPropagation();
        off("mousemove", window, handleYScrollMouseMove, true);
        off("mouseup", window, handleYScrollMouseUp, true);
        yBarPressed = false;
        sync();
        if (isMouseUpAway(e2)) {
          hideBar();
        }
      }
      vue.watchEffect(() => {
        const {
          value: needXBar
        } = needXBarRef;
        const {
          value: needYBar
        } = needYBarRef;
        const {
          value: mergedClsPrefix
        } = mergedClsPrefixRef;
        const {
          value: xRailEl
        } = xRailRef;
        const {
          value: yRailEl
        } = yRailRef;
        if (xRailEl) {
          if (!needXBar) {
            xRailEl.classList.add(`${mergedClsPrefix}-scrollbar-rail--disabled`);
          } else {
            xRailEl.classList.remove(`${mergedClsPrefix}-scrollbar-rail--disabled`);
          }
        }
        if (yRailEl) {
          if (!needYBar) {
            yRailEl.classList.add(`${mergedClsPrefix}-scrollbar-rail--disabled`);
          } else {
            yRailEl.classList.remove(`${mergedClsPrefix}-scrollbar-rail--disabled`);
          }
        }
      });
      vue.onMounted(() => {
        if (props.container)
          return;
        sync();
      });
      vue.onBeforeUnmount(() => {
        if (xBarVanishTimerId !== void 0) {
          window.clearTimeout(xBarVanishTimerId);
        }
        if (yBarVanishTimerId !== void 0) {
          window.clearTimeout(yBarVanishTimerId);
        }
        off("mousemove", window, handleYScrollMouseMove, true);
        off("mouseup", window, handleYScrollMouseUp, true);
      });
      const themeRef = useTheme("Scrollbar", "-scrollbar", style$7, scrollbarLight$1, props, mergedClsPrefixRef);
      const cssVarsRef = vue.computed(() => {
        const {
          common: {
            cubicBezierEaseInOut: cubicBezierEaseInOut2,
            scrollbarBorderRadius,
            scrollbarHeight,
            scrollbarWidth
          },
          self: {
            color,
            colorHover
          }
        } = themeRef.value;
        return {
          "--n-scrollbar-bezier": cubicBezierEaseInOut2,
          "--n-scrollbar-color": color,
          "--n-scrollbar-color-hover": colorHover,
          "--n-scrollbar-border-radius": scrollbarBorderRadius,
          "--n-scrollbar-width": scrollbarWidth,
          "--n-scrollbar-height": scrollbarHeight
        };
      });
      const themeClassHandle = inlineThemeDisabled ? useThemeClass("scrollbar", void 0, cssVarsRef, props) : void 0;
      const exposedMethods = {
        scrollTo,
        scrollBy,
        sync,
        syncUnifiedContainer,
        handleMouseEnterWrapper,
        handleMouseLeaveWrapper
      };
      return Object.assign(Object.assign({}, exposedMethods), {
        mergedClsPrefix: mergedClsPrefixRef,
        rtlEnabled: rtlEnabledRef,
        containerScrollTop: containerScrollTopRef,
        wrapperRef,
        containerRef,
        contentRef,
        yRailRef,
        xRailRef,
        needYBar: needYBarRef,
        needXBar: needXBarRef,
        yBarSizePx: yBarSizePxRef,
        xBarSizePx: xBarSizePxRef,
        yBarTopPx: yBarTopPxRef,
        xBarLeftPx: xBarLeftPxRef,
        isShowXBar: mergedShowXBarRef,
        isShowYBar: mergedShowYBarRef,
        isIos: isIos2,
        handleScroll,
        handleContentResize,
        handleContainerResize,
        handleYScrollMouseDown,
        handleXScrollMouseDown,
        cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
        themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
        onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender
      });
    },
    render() {
      var _a;
      const {
        $slots,
        mergedClsPrefix,
        triggerDisplayManually,
        rtlEnabled,
        internalHoistYRail
      } = this;
      if (!this.scrollable)
        return (_a = $slots.default) === null || _a === void 0 ? void 0 : _a.call($slots);
      const triggerIsNone = this.trigger === "none";
      const createYRail = (className, style2) => {
        return vue.h("div", {
          ref: "yRailRef",
          class: [`${mergedClsPrefix}-scrollbar-rail`, `${mergedClsPrefix}-scrollbar-rail--vertical`, className],
          "data-scrollbar-rail": true,
          style: [style2 || "", this.verticalRailStyle],
          "aria-hidden": true
        }, vue.h(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          triggerIsNone ? Wrapper : vue.Transition,
          triggerIsNone ? null : {
            name: "fade-in-transition"
          },
          {
            default: () => this.needYBar && this.isShowYBar && !this.isIos ? vue.h("div", {
              class: `${mergedClsPrefix}-scrollbar-rail__scrollbar`,
              style: {
                height: this.yBarSizePx,
                top: this.yBarTopPx
              },
              onMousedown: this.handleYScrollMouseDown
            }) : null
          }
        ));
      };
      const createChildren = () => {
        var _a2, _b;
        (_a2 = this.onRender) === null || _a2 === void 0 ? void 0 : _a2.call(this);
        return vue.h("div", vue.mergeProps(this.$attrs, {
          role: "none",
          ref: "wrapperRef",
          class: [`${mergedClsPrefix}-scrollbar`, this.themeClass, rtlEnabled && `${mergedClsPrefix}-scrollbar--rtl`],
          style: this.cssVars,
          onMouseenter: triggerDisplayManually ? void 0 : this.handleMouseEnterWrapper,
          onMouseleave: triggerDisplayManually ? void 0 : this.handleMouseLeaveWrapper
        }), [this.container ? (_b = $slots.default) === null || _b === void 0 ? void 0 : _b.call($slots) : vue.h("div", {
          role: "none",
          ref: "containerRef",
          class: [`${mergedClsPrefix}-scrollbar-container`, this.containerClass],
          style: this.containerStyle,
          onScroll: this.handleScroll,
          onWheel: this.onWheel
        }, vue.h(VResizeObserver, {
          onResize: this.handleContentResize
        }, {
          default: () => vue.h("div", {
            ref: "contentRef",
            role: "none",
            style: [{
              width: this.xScrollable ? "fit-content" : null
            }, this.contentStyle],
            class: [`${mergedClsPrefix}-scrollbar-content`, this.contentClass]
          }, $slots)
        })), internalHoistYRail ? null : createYRail(void 0, void 0), this.xScrollable && vue.h("div", {
          ref: "xRailRef",
          class: [`${mergedClsPrefix}-scrollbar-rail`, `${mergedClsPrefix}-scrollbar-rail--horizontal`],
          style: this.horizontalRailStyle,
          "data-scrollbar-rail": true,
          "aria-hidden": true
        }, vue.h(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          triggerIsNone ? Wrapper : vue.Transition,
          triggerIsNone ? null : {
            name: "fade-in-transition"
          },
          {
            default: () => this.needXBar && this.isShowXBar && !this.isIos ? vue.h("div", {
              class: `${mergedClsPrefix}-scrollbar-rail__scrollbar`,
              style: {
                width: this.xBarSizePx,
                right: rtlEnabled ? this.xBarLeftPx : void 0,
                left: rtlEnabled ? void 0 : this.xBarLeftPx
              },
              onMousedown: this.handleXScrollMouseDown
            }) : null
          }
        ))]);
      };
      const scrollbarNode = this.container ? createChildren() : vue.h(VResizeObserver, {
        onResize: this.handleContainerResize
      }, {
        default: createChildren
      });
      if (internalHoistYRail) {
        return vue.h(vue.Fragment, null, scrollbarNode, createYRail(this.themeClass, this.cssVars));
      } else {
        return scrollbarNode;
      }
    }
  });
  const NScrollbar = Scrollbar;
  const {
    cubicBezierEaseIn,
    cubicBezierEaseOut
  } = commonVariables$2;
  function fadeInScaleUpTransition({
    transformOrigin = "inherit",
    duration: duration2 = ".2s",
    enterScale = ".9",
    originalTransform = "",
    originalTransition = ""
  } = {}) {
    return [c("&.fade-in-scale-up-transition-leave-active", {
      transformOrigin,
      transition: `opacity ${duration2} ${cubicBezierEaseIn}, transform ${duration2} ${cubicBezierEaseIn} ${originalTransition && "," + originalTransition}`
    }), c("&.fade-in-scale-up-transition-enter-active", {
      transformOrigin,
      transition: `opacity ${duration2} ${cubicBezierEaseOut}, transform ${duration2} ${cubicBezierEaseOut} ${originalTransition && "," + originalTransition}`
    }), c("&.fade-in-scale-up-transition-enter-from, &.fade-in-scale-up-transition-leave-to", {
      opacity: 0,
      transform: `${originalTransform} scale(${enterScale})`
    }), c("&.fade-in-scale-up-transition-leave-from, &.fade-in-scale-up-transition-enter-to", {
      opacity: 1,
      transform: `${originalTransform} scale(1)`
    })];
  }
  const style$6 = cB("base-wave", `
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
`);
  const NBaseWave = vue.defineComponent({
    name: "BaseWave",
    props: {
      clsPrefix: {
        type: String,
        required: true
      }
    },
    setup(props) {
      useStyle("-base-wave", style$6, vue.toRef(props, "clsPrefix"));
      const selfRef = vue.ref(null);
      const activeRef = vue.ref(false);
      let animationTimerId = null;
      vue.onBeforeUnmount(() => {
        if (animationTimerId !== null) {
          window.clearTimeout(animationTimerId);
        }
      });
      return {
        active: activeRef,
        selfRef,
        play() {
          if (animationTimerId !== null) {
            window.clearTimeout(animationTimerId);
            activeRef.value = false;
            animationTimerId = null;
          }
          void vue.nextTick(() => {
            var _a;
            void ((_a = selfRef.value) === null || _a === void 0 ? void 0 : _a.offsetHeight);
            activeRef.value = true;
            animationTimerId = window.setTimeout(() => {
              activeRef.value = false;
              animationTimerId = null;
            }, 1e3);
          });
        }
      };
    },
    render() {
      const {
        clsPrefix
      } = this;
      return vue.h("div", {
        ref: "selfRef",
        "aria-hidden": true,
        class: [`${clsPrefix}-base-wave`, this.active && `${clsPrefix}-base-wave--active`]
      });
    }
  });
  const {
    cubicBezierEaseInOut
  } = commonVariables$2;
  function fadeInWidthExpandTransition({
    duration: duration2 = ".2s",
    delay = ".1s"
  } = {}) {
    return [c("&.fade-in-width-expand-transition-leave-from, &.fade-in-width-expand-transition-enter-to", {
      opacity: 1
    }), c("&.fade-in-width-expand-transition-leave-to, &.fade-in-width-expand-transition-enter-from", `
 opacity: 0!important;
 margin-left: 0!important;
 margin-right: 0!important;
 `), c("&.fade-in-width-expand-transition-leave-active", `
 overflow: hidden;
 transition:
 opacity ${duration2} ${cubicBezierEaseInOut},
 max-width ${duration2} ${cubicBezierEaseInOut} ${delay},
 margin-left ${duration2} ${cubicBezierEaseInOut} ${delay},
 margin-right ${duration2} ${cubicBezierEaseInOut} ${delay};
 `), c("&.fade-in-width-expand-transition-enter-active", `
 overflow: hidden;
 transition:
 opacity ${duration2} ${cubicBezierEaseInOut} ${delay},
 max-width ${duration2} ${cubicBezierEaseInOut},
 margin-left ${duration2} ${cubicBezierEaseInOut},
 margin-right ${duration2} ${cubicBezierEaseInOut};
 `)];
  }
  const isChrome = isBrowser$2 && "chrome" in window;
  isBrowser$2 && navigator.userAgent.includes("Firefox");
  const isSafari = isBrowser$2 && navigator.userAgent.includes("Safari") && !isChrome;
  function createHoverColor(rgb) {
    return composite(rgb, [255, 255, 255, 0.16]);
  }
  function createPressedColor(rgb) {
    return composite(rgb, [0, 0, 0, 0.12]);
  }
  const buttonGroupInjectionKey = createInjectionKey("n-button-group");
  const commonVariables$1 = {
    paddingTiny: "0 6px",
    paddingSmall: "0 10px",
    paddingMedium: "0 14px",
    paddingLarge: "0 18px",
    paddingRoundTiny: "0 10px",
    paddingRoundSmall: "0 14px",
    paddingRoundMedium: "0 18px",
    paddingRoundLarge: "0 22px",
    iconMarginTiny: "6px",
    iconMarginSmall: "6px",
    iconMarginMedium: "6px",
    iconMarginLarge: "6px",
    iconSizeTiny: "14px",
    iconSizeSmall: "18px",
    iconSizeMedium: "18px",
    iconSizeLarge: "20px",
    rippleDuration: ".6s"
  };
  const self$6 = (vars) => {
    const {
      heightTiny,
      heightSmall,
      heightMedium,
      heightLarge,
      borderRadius,
      fontSizeTiny,
      fontSizeSmall,
      fontSizeMedium,
      fontSizeLarge,
      opacityDisabled,
      textColor2,
      textColor3,
      primaryColorHover,
      primaryColorPressed,
      borderColor,
      primaryColor,
      baseColor,
      infoColor,
      infoColorHover,
      infoColorPressed,
      successColor,
      successColorHover,
      successColorPressed,
      warningColor,
      warningColorHover,
      warningColorPressed,
      errorColor,
      errorColorHover,
      errorColorPressed,
      fontWeight,
      buttonColor2,
      buttonColor2Hover,
      buttonColor2Pressed,
      fontWeightStrong
    } = vars;
    return Object.assign(Object.assign({}, commonVariables$1), {
      heightTiny,
      heightSmall,
      heightMedium,
      heightLarge,
      borderRadiusTiny: borderRadius,
      borderRadiusSmall: borderRadius,
      borderRadiusMedium: borderRadius,
      borderRadiusLarge: borderRadius,
      fontSizeTiny,
      fontSizeSmall,
      fontSizeMedium,
      fontSizeLarge,
      opacityDisabled,
      // secondary
      colorOpacitySecondary: "0.16",
      colorOpacitySecondaryHover: "0.22",
      colorOpacitySecondaryPressed: "0.28",
      colorSecondary: buttonColor2,
      colorSecondaryHover: buttonColor2Hover,
      colorSecondaryPressed: buttonColor2Pressed,
      // tertiary
      colorTertiary: buttonColor2,
      colorTertiaryHover: buttonColor2Hover,
      colorTertiaryPressed: buttonColor2Pressed,
      // quaternary
      colorQuaternary: "#0000",
      colorQuaternaryHover: buttonColor2Hover,
      colorQuaternaryPressed: buttonColor2Pressed,
      // default type
      color: "#0000",
      colorHover: "#0000",
      colorPressed: "#0000",
      colorFocus: "#0000",
      colorDisabled: "#0000",
      textColor: textColor2,
      textColorTertiary: textColor3,
      textColorHover: primaryColorHover,
      textColorPressed: primaryColorPressed,
      textColorFocus: primaryColorHover,
      textColorDisabled: textColor2,
      textColorText: textColor2,
      textColorTextHover: primaryColorHover,
      textColorTextPressed: primaryColorPressed,
      textColorTextFocus: primaryColorHover,
      textColorTextDisabled: textColor2,
      textColorGhost: textColor2,
      textColorGhostHover: primaryColorHover,
      textColorGhostPressed: primaryColorPressed,
      textColorGhostFocus: primaryColorHover,
      textColorGhostDisabled: textColor2,
      border: `1px solid ${borderColor}`,
      borderHover: `1px solid ${primaryColorHover}`,
      borderPressed: `1px solid ${primaryColorPressed}`,
      borderFocus: `1px solid ${primaryColorHover}`,
      borderDisabled: `1px solid ${borderColor}`,
      rippleColor: primaryColor,
      // primary
      colorPrimary: primaryColor,
      colorHoverPrimary: primaryColorHover,
      colorPressedPrimary: primaryColorPressed,
      colorFocusPrimary: primaryColorHover,
      colorDisabledPrimary: primaryColor,
      textColorPrimary: baseColor,
      textColorHoverPrimary: baseColor,
      textColorPressedPrimary: baseColor,
      textColorFocusPrimary: baseColor,
      textColorDisabledPrimary: baseColor,
      textColorTextPrimary: primaryColor,
      textColorTextHoverPrimary: primaryColorHover,
      textColorTextPressedPrimary: primaryColorPressed,
      textColorTextFocusPrimary: primaryColorHover,
      textColorTextDisabledPrimary: textColor2,
      textColorGhostPrimary: primaryColor,
      textColorGhostHoverPrimary: primaryColorHover,
      textColorGhostPressedPrimary: primaryColorPressed,
      textColorGhostFocusPrimary: primaryColorHover,
      textColorGhostDisabledPrimary: primaryColor,
      borderPrimary: `1px solid ${primaryColor}`,
      borderHoverPrimary: `1px solid ${primaryColorHover}`,
      borderPressedPrimary: `1px solid ${primaryColorPressed}`,
      borderFocusPrimary: `1px solid ${primaryColorHover}`,
      borderDisabledPrimary: `1px solid ${primaryColor}`,
      rippleColorPrimary: primaryColor,
      // info
      colorInfo: infoColor,
      colorHoverInfo: infoColorHover,
      colorPressedInfo: infoColorPressed,
      colorFocusInfo: infoColorHover,
      colorDisabledInfo: infoColor,
      textColorInfo: baseColor,
      textColorHoverInfo: baseColor,
      textColorPressedInfo: baseColor,
      textColorFocusInfo: baseColor,
      textColorDisabledInfo: baseColor,
      textColorTextInfo: infoColor,
      textColorTextHoverInfo: infoColorHover,
      textColorTextPressedInfo: infoColorPressed,
      textColorTextFocusInfo: infoColorHover,
      textColorTextDisabledInfo: textColor2,
      textColorGhostInfo: infoColor,
      textColorGhostHoverInfo: infoColorHover,
      textColorGhostPressedInfo: infoColorPressed,
      textColorGhostFocusInfo: infoColorHover,
      textColorGhostDisabledInfo: infoColor,
      borderInfo: `1px solid ${infoColor}`,
      borderHoverInfo: `1px solid ${infoColorHover}`,
      borderPressedInfo: `1px solid ${infoColorPressed}`,
      borderFocusInfo: `1px solid ${infoColorHover}`,
      borderDisabledInfo: `1px solid ${infoColor}`,
      rippleColorInfo: infoColor,
      // success
      colorSuccess: successColor,
      colorHoverSuccess: successColorHover,
      colorPressedSuccess: successColorPressed,
      colorFocusSuccess: successColorHover,
      colorDisabledSuccess: successColor,
      textColorSuccess: baseColor,
      textColorHoverSuccess: baseColor,
      textColorPressedSuccess: baseColor,
      textColorFocusSuccess: baseColor,
      textColorDisabledSuccess: baseColor,
      textColorTextSuccess: successColor,
      textColorTextHoverSuccess: successColorHover,
      textColorTextPressedSuccess: successColorPressed,
      textColorTextFocusSuccess: successColorHover,
      textColorTextDisabledSuccess: textColor2,
      textColorGhostSuccess: successColor,
      textColorGhostHoverSuccess: successColorHover,
      textColorGhostPressedSuccess: successColorPressed,
      textColorGhostFocusSuccess: successColorHover,
      textColorGhostDisabledSuccess: successColor,
      borderSuccess: `1px solid ${successColor}`,
      borderHoverSuccess: `1px solid ${successColorHover}`,
      borderPressedSuccess: `1px solid ${successColorPressed}`,
      borderFocusSuccess: `1px solid ${successColorHover}`,
      borderDisabledSuccess: `1px solid ${successColor}`,
      rippleColorSuccess: successColor,
      // warning
      colorWarning: warningColor,
      colorHoverWarning: warningColorHover,
      colorPressedWarning: warningColorPressed,
      colorFocusWarning: warningColorHover,
      colorDisabledWarning: warningColor,
      textColorWarning: baseColor,
      textColorHoverWarning: baseColor,
      textColorPressedWarning: baseColor,
      textColorFocusWarning: baseColor,
      textColorDisabledWarning: baseColor,
      textColorTextWarning: warningColor,
      textColorTextHoverWarning: warningColorHover,
      textColorTextPressedWarning: warningColorPressed,
      textColorTextFocusWarning: warningColorHover,
      textColorTextDisabledWarning: textColor2,
      textColorGhostWarning: warningColor,
      textColorGhostHoverWarning: warningColorHover,
      textColorGhostPressedWarning: warningColorPressed,
      textColorGhostFocusWarning: warningColorHover,
      textColorGhostDisabledWarning: warningColor,
      borderWarning: `1px solid ${warningColor}`,
      borderHoverWarning: `1px solid ${warningColorHover}`,
      borderPressedWarning: `1px solid ${warningColorPressed}`,
      borderFocusWarning: `1px solid ${warningColorHover}`,
      borderDisabledWarning: `1px solid ${warningColor}`,
      rippleColorWarning: warningColor,
      // error
      colorError: errorColor,
      colorHoverError: errorColorHover,
      colorPressedError: errorColorPressed,
      colorFocusError: errorColorHover,
      colorDisabledError: errorColor,
      textColorError: baseColor,
      textColorHoverError: baseColor,
      textColorPressedError: baseColor,
      textColorFocusError: baseColor,
      textColorDisabledError: baseColor,
      textColorTextError: errorColor,
      textColorTextHoverError: errorColorHover,
      textColorTextPressedError: errorColorPressed,
      textColorTextFocusError: errorColorHover,
      textColorTextDisabledError: textColor2,
      textColorGhostError: errorColor,
      textColorGhostHoverError: errorColorHover,
      textColorGhostPressedError: errorColorPressed,
      textColorGhostFocusError: errorColorHover,
      textColorGhostDisabledError: errorColor,
      borderError: `1px solid ${errorColor}`,
      borderHoverError: `1px solid ${errorColorHover}`,
      borderPressedError: `1px solid ${errorColorPressed}`,
      borderFocusError: `1px solid ${errorColorHover}`,
      borderDisabledError: `1px solid ${errorColor}`,
      rippleColorError: errorColor,
      waveOpacity: "0.6",
      fontWeight,
      fontWeightStrong
    });
  };
  const buttonLight = {
    name: "Button",
    common: commonLight,
    self: self$6
  };
  const buttonLight$1 = buttonLight;
  const style$5 = c([cB("button", `
 margin: 0;
 font-weight: var(--n-font-weight);
 line-height: 1;
 font-family: inherit;
 padding: var(--n-padding);
 height: var(--n-height);
 font-size: var(--n-font-size);
 border-radius: var(--n-border-radius);
 color: var(--n-text-color);
 background-color: var(--n-color);
 width: var(--n-width);
 white-space: nowrap;
 outline: none;
 position: relative;
 z-index: auto;
 border: none;
 display: inline-flex;
 flex-wrap: nowrap;
 flex-shrink: 0;
 align-items: center;
 justify-content: center;
 user-select: none;
 -webkit-user-select: none;
 text-align: center;
 cursor: pointer;
 text-decoration: none;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `, [cM("color", [cE("border", {
    borderColor: "var(--n-border-color)"
  }), cM("disabled", [cE("border", {
    borderColor: "var(--n-border-color-disabled)"
  })]), cNotM("disabled", [c("&:focus", [cE("state-border", {
    borderColor: "var(--n-border-color-focus)"
  })]), c("&:hover", [cE("state-border", {
    borderColor: "var(--n-border-color-hover)"
  })]), c("&:active", [cE("state-border", {
    borderColor: "var(--n-border-color-pressed)"
  })]), cM("pressed", [cE("state-border", {
    borderColor: "var(--n-border-color-pressed)"
  })])])]), cM("disabled", {
    backgroundColor: "var(--n-color-disabled)",
    color: "var(--n-text-color-disabled)"
  }, [cE("border", {
    border: "var(--n-border-disabled)"
  })]), cNotM("disabled", [c("&:focus", {
    backgroundColor: "var(--n-color-focus)",
    color: "var(--n-text-color-focus)"
  }, [cE("state-border", {
    border: "var(--n-border-focus)"
  })]), c("&:hover", {
    backgroundColor: "var(--n-color-hover)",
    color: "var(--n-text-color-hover)"
  }, [cE("state-border", {
    border: "var(--n-border-hover)"
  })]), c("&:active", {
    backgroundColor: "var(--n-color-pressed)",
    color: "var(--n-text-color-pressed)"
  }, [cE("state-border", {
    border: "var(--n-border-pressed)"
  })]), cM("pressed", {
    backgroundColor: "var(--n-color-pressed)",
    color: "var(--n-text-color-pressed)"
  }, [cE("state-border", {
    border: "var(--n-border-pressed)"
  })])]), cM("loading", "cursor: wait;"), cB("base-wave", `
 pointer-events: none;
 top: 0;
 right: 0;
 bottom: 0;
 left: 0;
 animation-iteration-count: 1;
 animation-duration: var(--n-ripple-duration);
 animation-timing-function: var(--n-bezier-ease-out), var(--n-bezier-ease-out);
 `, [cM("active", {
    zIndex: 1,
    animationName: "button-wave-spread, button-wave-opacity"
  })]), isBrowser$2 && "MozBoxSizing" in document.createElement("div").style ? c("&::moz-focus-inner", {
    border: 0
  }) : null, cE("border, state-border", `
 position: absolute;
 left: 0;
 top: 0;
 right: 0;
 bottom: 0;
 border-radius: inherit;
 transition: border-color .3s var(--n-bezier);
 pointer-events: none;
 `), cE("border", {
    border: "var(--n-border)"
  }), cE("state-border", {
    border: "var(--n-border)",
    borderColor: "#0000",
    zIndex: 1
  }), cE("icon", `
 margin: var(--n-icon-margin);
 margin-left: 0;
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 max-width: var(--n-icon-size);
 font-size: var(--n-icon-size);
 position: relative;
 flex-shrink: 0;
 `, [cB("icon-slot", `
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 position: absolute;
 left: 0;
 top: 50%;
 transform: translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 `, [iconSwitchTransition({
    top: "50%",
    originalTransform: "translateY(-50%)"
  })]), fadeInWidthExpandTransition()]), cE("content", `
 display: flex;
 align-items: center;
 flex-wrap: nowrap;
 min-width: 0;
 `, [c("~", [cE("icon", {
    margin: "var(--n-icon-margin)",
    marginRight: 0
  })])]), cM("block", `
 display: flex;
 width: 100%;
 `), cM("dashed", [cE("border, state-border", {
    borderStyle: "dashed !important"
  })]), cM("disabled", {
    cursor: "not-allowed",
    opacity: "var(--n-opacity-disabled)"
  })]), c("@keyframes button-wave-spread", {
    from: {
      boxShadow: "0 0 0.5px 0 var(--n-ripple-color)"
    },
    to: {
      // don't use exact 5px since chrome will display the animation with glitches
      boxShadow: "0 0 0.5px 4.5px var(--n-ripple-color)"
    }
  }), c("@keyframes button-wave-opacity", {
    from: {
      opacity: "var(--n-wave-opacity)"
    },
    to: {
      opacity: 0
    }
  })]);
  const buttonProps = Object.assign(Object.assign({}, useTheme.props), {
    color: String,
    textColor: String,
    text: Boolean,
    block: Boolean,
    loading: Boolean,
    disabled: Boolean,
    circle: Boolean,
    size: String,
    ghost: Boolean,
    round: Boolean,
    secondary: Boolean,
    tertiary: Boolean,
    quaternary: Boolean,
    strong: Boolean,
    focusable: {
      type: Boolean,
      default: true
    },
    keyboard: {
      type: Boolean,
      default: true
    },
    tag: {
      type: String,
      default: "button"
    },
    type: {
      type: String,
      default: "default"
    },
    dashed: Boolean,
    renderIcon: Function,
    iconPlacement: {
      type: String,
      default: "left"
    },
    attrType: {
      type: String,
      default: "button"
    },
    bordered: {
      type: Boolean,
      default: true
    },
    onClick: [Function, Array],
    nativeFocusBehavior: {
      type: Boolean,
      default: !isSafari
    }
  });
  const Button = vue.defineComponent({
    name: "Button",
    props: buttonProps,
    setup(props) {
      if (process.env.NODE_ENV !== "production") {
        vue.watchEffect(() => {
          const {
            dashed,
            ghost,
            text,
            secondary,
            tertiary,
            quaternary
          } = props;
          if ((dashed || ghost || text) && (secondary || tertiary || quaternary)) {
            warnOnce("button", "`dashed`, `ghost` and `text` props can't be used along with `secondary`, `tertiary` and `quaternary` props.");
          }
        });
      }
      const selfElRef = vue.ref(null);
      const waveElRef = vue.ref(null);
      const enterPressedRef = vue.ref(false);
      const showBorderRef = useMemo(() => {
        return !props.quaternary && !props.tertiary && !props.secondary && !props.text && (!props.color || props.ghost || props.dashed) && props.bordered;
      });
      const NButtonGroup = vue.inject(buttonGroupInjectionKey, {});
      const {
        mergedSizeRef
      } = useFormItem({}, {
        defaultSize: "medium",
        mergedSize: (NFormItem) => {
          const {
            size: size2
          } = props;
          if (size2)
            return size2;
          const {
            size: buttonGroupSize
          } = NButtonGroup;
          if (buttonGroupSize)
            return buttonGroupSize;
          const {
            mergedSize: formItemSize
          } = NFormItem || {};
          if (formItemSize) {
            return formItemSize.value;
          }
          return "medium";
        }
      });
      const mergedFocusableRef = vue.computed(() => {
        return props.focusable && !props.disabled;
      });
      const handleMousedown = (e2) => {
        var _a;
        if (!mergedFocusableRef.value) {
          e2.preventDefault();
        }
        if (props.nativeFocusBehavior) {
          return;
        }
        e2.preventDefault();
        if (props.disabled) {
          return;
        }
        if (mergedFocusableRef.value) {
          (_a = selfElRef.value) === null || _a === void 0 ? void 0 : _a.focus({
            preventScroll: true
          });
        }
      };
      const handleClick2 = (e2) => {
        var _a;
        if (!props.disabled && !props.loading) {
          const {
            onClick
          } = props;
          if (onClick)
            call(onClick, e2);
          if (!props.text) {
            (_a = waveElRef.value) === null || _a === void 0 ? void 0 : _a.play();
          }
        }
      };
      const handleKeyup = (e2) => {
        switch (e2.key) {
          case "Enter":
            if (!props.keyboard) {
              return;
            }
            enterPressedRef.value = false;
        }
      };
      const handleKeydown = (e2) => {
        switch (e2.key) {
          case "Enter":
            if (!props.keyboard || props.loading) {
              e2.preventDefault();
              return;
            }
            enterPressedRef.value = true;
        }
      };
      const handleBlur = () => {
        enterPressedRef.value = false;
      };
      const {
        inlineThemeDisabled,
        mergedClsPrefixRef,
        mergedRtlRef
      } = useConfig(props);
      const themeRef = useTheme("Button", "-button", style$5, buttonLight$1, props, mergedClsPrefixRef);
      const rtlEnabledRef = useRtl("Button", mergedRtlRef, mergedClsPrefixRef);
      const cssVarsRef = vue.computed(() => {
        const theme = themeRef.value;
        const {
          common: {
            cubicBezierEaseInOut: cubicBezierEaseInOut2,
            cubicBezierEaseOut: cubicBezierEaseOut2
          },
          self: self2
        } = theme;
        const {
          rippleDuration,
          opacityDisabled,
          fontWeight,
          fontWeightStrong
        } = self2;
        const size2 = mergedSizeRef.value;
        const {
          dashed,
          type: type2,
          ghost,
          text,
          color,
          round,
          circle,
          textColor,
          secondary,
          tertiary,
          quaternary,
          strong
        } = props;
        const fontProps = {
          "font-weight": strong ? fontWeightStrong : fontWeight
        };
        let colorProps = {
          "--n-color": "initial",
          "--n-color-hover": "initial",
          "--n-color-pressed": "initial",
          "--n-color-focus": "initial",
          "--n-color-disabled": "initial",
          "--n-ripple-color": "initial",
          "--n-text-color": "initial",
          "--n-text-color-hover": "initial",
          "--n-text-color-pressed": "initial",
          "--n-text-color-focus": "initial",
          "--n-text-color-disabled": "initial"
        };
        const typeIsTertiary = type2 === "tertiary";
        const typeIsDefault = type2 === "default";
        const mergedType = typeIsTertiary ? "default" : type2;
        if (text) {
          const propTextColor = textColor || color;
          const mergedTextColor = propTextColor || self2[createKey("textColorText", mergedType)];
          colorProps = {
            "--n-color": "#0000",
            "--n-color-hover": "#0000",
            "--n-color-pressed": "#0000",
            "--n-color-focus": "#0000",
            "--n-color-disabled": "#0000",
            "--n-ripple-color": "#0000",
            "--n-text-color": mergedTextColor,
            "--n-text-color-hover": propTextColor ? createHoverColor(propTextColor) : self2[createKey("textColorTextHover", mergedType)],
            "--n-text-color-pressed": propTextColor ? createPressedColor(propTextColor) : self2[createKey("textColorTextPressed", mergedType)],
            "--n-text-color-focus": propTextColor ? createHoverColor(propTextColor) : self2[createKey("textColorTextHover", mergedType)],
            "--n-text-color-disabled": propTextColor || self2[createKey("textColorTextDisabled", mergedType)]
          };
        } else if (ghost || dashed) {
          const mergedTextColor = textColor || color;
          colorProps = {
            "--n-color": "#0000",
            "--n-color-hover": "#0000",
            "--n-color-pressed": "#0000",
            "--n-color-focus": "#0000",
            "--n-color-disabled": "#0000",
            "--n-ripple-color": color || self2[createKey("rippleColor", mergedType)],
            "--n-text-color": mergedTextColor || self2[createKey("textColorGhost", mergedType)],
            "--n-text-color-hover": mergedTextColor ? createHoverColor(mergedTextColor) : self2[createKey("textColorGhostHover", mergedType)],
            "--n-text-color-pressed": mergedTextColor ? createPressedColor(mergedTextColor) : self2[createKey("textColorGhostPressed", mergedType)],
            "--n-text-color-focus": mergedTextColor ? createHoverColor(mergedTextColor) : self2[createKey("textColorGhostHover", mergedType)],
            "--n-text-color-disabled": mergedTextColor || self2[createKey("textColorGhostDisabled", mergedType)]
          };
        } else if (secondary) {
          const typeTextColor = typeIsDefault ? self2.textColor : typeIsTertiary ? self2.textColorTertiary : self2[createKey("color", mergedType)];
          const mergedTextColor = color || typeTextColor;
          const isColoredType = type2 !== "default" && type2 !== "tertiary";
          colorProps = {
            "--n-color": isColoredType ? changeColor(mergedTextColor, {
              alpha: Number(self2.colorOpacitySecondary)
            }) : self2.colorSecondary,
            "--n-color-hover": isColoredType ? changeColor(mergedTextColor, {
              alpha: Number(self2.colorOpacitySecondaryHover)
            }) : self2.colorSecondaryHover,
            "--n-color-pressed": isColoredType ? changeColor(mergedTextColor, {
              alpha: Number(self2.colorOpacitySecondaryPressed)
            }) : self2.colorSecondaryPressed,
            "--n-color-focus": isColoredType ? changeColor(mergedTextColor, {
              alpha: Number(self2.colorOpacitySecondaryHover)
            }) : self2.colorSecondaryHover,
            "--n-color-disabled": self2.colorSecondary,
            "--n-ripple-color": "#0000",
            "--n-text-color": mergedTextColor,
            "--n-text-color-hover": mergedTextColor,
            "--n-text-color-pressed": mergedTextColor,
            "--n-text-color-focus": mergedTextColor,
            "--n-text-color-disabled": mergedTextColor
          };
        } else if (tertiary || quaternary) {
          const typeColor = typeIsDefault ? self2.textColor : typeIsTertiary ? self2.textColorTertiary : self2[createKey("color", mergedType)];
          const mergedColor = color || typeColor;
          if (tertiary) {
            colorProps["--n-color"] = self2.colorTertiary;
            colorProps["--n-color-hover"] = self2.colorTertiaryHover;
            colorProps["--n-color-pressed"] = self2.colorTertiaryPressed;
            colorProps["--n-color-focus"] = self2.colorSecondaryHover;
            colorProps["--n-color-disabled"] = self2.colorTertiary;
          } else {
            colorProps["--n-color"] = self2.colorQuaternary;
            colorProps["--n-color-hover"] = self2.colorQuaternaryHover;
            colorProps["--n-color-pressed"] = self2.colorQuaternaryPressed;
            colorProps["--n-color-focus"] = self2.colorQuaternaryHover;
            colorProps["--n-color-disabled"] = self2.colorQuaternary;
          }
          colorProps["--n-ripple-color"] = "#0000";
          colorProps["--n-text-color"] = mergedColor;
          colorProps["--n-text-color-hover"] = mergedColor;
          colorProps["--n-text-color-pressed"] = mergedColor;
          colorProps["--n-text-color-focus"] = mergedColor;
          colorProps["--n-text-color-disabled"] = mergedColor;
        } else {
          colorProps = {
            "--n-color": color || self2[createKey("color", mergedType)],
            "--n-color-hover": color ? createHoverColor(color) : self2[createKey("colorHover", mergedType)],
            "--n-color-pressed": color ? createPressedColor(color) : self2[createKey("colorPressed", mergedType)],
            "--n-color-focus": color ? createHoverColor(color) : self2[createKey("colorFocus", mergedType)],
            "--n-color-disabled": color || self2[createKey("colorDisabled", mergedType)],
            "--n-ripple-color": color || self2[createKey("rippleColor", mergedType)],
            "--n-text-color": textColor || (color ? self2.textColorPrimary : typeIsTertiary ? self2.textColorTertiary : self2[createKey("textColor", mergedType)]),
            "--n-text-color-hover": textColor || (color ? self2.textColorHoverPrimary : self2[createKey("textColorHover", mergedType)]),
            "--n-text-color-pressed": textColor || (color ? self2.textColorPressedPrimary : self2[createKey("textColorPressed", mergedType)]),
            "--n-text-color-focus": textColor || (color ? self2.textColorFocusPrimary : self2[createKey("textColorFocus", mergedType)]),
            "--n-text-color-disabled": textColor || (color ? self2.textColorDisabledPrimary : self2[createKey("textColorDisabled", mergedType)])
          };
        }
        let borderProps = {
          "--n-border": "initial",
          "--n-border-hover": "initial",
          "--n-border-pressed": "initial",
          "--n-border-focus": "initial",
          "--n-border-disabled": "initial"
        };
        if (text) {
          borderProps = {
            "--n-border": "none",
            "--n-border-hover": "none",
            "--n-border-pressed": "none",
            "--n-border-focus": "none",
            "--n-border-disabled": "none"
          };
        } else {
          borderProps = {
            "--n-border": self2[createKey("border", mergedType)],
            "--n-border-hover": self2[createKey("borderHover", mergedType)],
            "--n-border-pressed": self2[createKey("borderPressed", mergedType)],
            "--n-border-focus": self2[createKey("borderFocus", mergedType)],
            "--n-border-disabled": self2[createKey("borderDisabled", mergedType)]
          };
        }
        const {
          [createKey("height", size2)]: height,
          [createKey("fontSize", size2)]: fontSize2,
          [createKey("padding", size2)]: padding,
          [createKey("paddingRound", size2)]: paddingRound,
          [createKey("iconSize", size2)]: iconSize,
          [createKey("borderRadius", size2)]: borderRadius,
          [createKey("iconMargin", size2)]: iconMargin,
          waveOpacity
        } = self2;
        const sizeProps = {
          "--n-width": circle && !text ? height : "initial",
          "--n-height": text ? "initial" : height,
          "--n-font-size": fontSize2,
          "--n-padding": circle ? "initial" : text ? "initial" : round ? paddingRound : padding,
          "--n-icon-size": iconSize,
          "--n-icon-margin": iconMargin,
          "--n-border-radius": text ? "initial" : circle || round ? height : borderRadius
        };
        return Object.assign(Object.assign(Object.assign(Object.assign({
          "--n-bezier": cubicBezierEaseInOut2,
          "--n-bezier-ease-out": cubicBezierEaseOut2,
          "--n-ripple-duration": rippleDuration,
          "--n-opacity-disabled": opacityDisabled,
          "--n-wave-opacity": waveOpacity
        }, fontProps), colorProps), borderProps), sizeProps);
      });
      const themeClassHandle = inlineThemeDisabled ? useThemeClass("button", vue.computed(() => {
        let hash = "";
        const {
          dashed,
          type: type2,
          ghost,
          text,
          color,
          round,
          circle,
          textColor,
          secondary,
          tertiary,
          quaternary,
          strong
        } = props;
        if (dashed)
          hash += "a";
        if (ghost)
          hash += "b";
        if (text)
          hash += "c";
        if (round)
          hash += "d";
        if (circle)
          hash += "e";
        if (secondary)
          hash += "f";
        if (tertiary)
          hash += "g";
        if (quaternary)
          hash += "h";
        if (strong)
          hash += "i";
        if (color)
          hash += "j" + color2Class(color);
        if (textColor)
          hash += "k" + color2Class(textColor);
        const {
          value: size2
        } = mergedSizeRef;
        hash += "l" + size2[0];
        hash += "m" + type2[0];
        return hash;
      }), cssVarsRef, props) : void 0;
      return {
        selfElRef,
        waveElRef,
        mergedClsPrefix: mergedClsPrefixRef,
        mergedFocusable: mergedFocusableRef,
        mergedSize: mergedSizeRef,
        showBorder: showBorderRef,
        enterPressed: enterPressedRef,
        rtlEnabled: rtlEnabledRef,
        handleMousedown,
        handleKeydown,
        handleBlur,
        handleKeyup,
        handleClick: handleClick2,
        customColorCssVars: vue.computed(() => {
          const {
            color
          } = props;
          if (!color)
            return null;
          const hoverColor = createHoverColor(color);
          return {
            "--n-border-color": color,
            "--n-border-color-hover": hoverColor,
            "--n-border-color-pressed": createPressedColor(color),
            "--n-border-color-focus": hoverColor,
            "--n-border-color-disabled": color
          };
        }),
        cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
        themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
        onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender
      };
    },
    render() {
      const {
        mergedClsPrefix,
        tag: Component,
        onRender
      } = this;
      onRender === null || onRender === void 0 ? void 0 : onRender();
      const children = resolveWrappedSlot(this.$slots.default, (children2) => children2 && vue.h("span", {
        class: `${mergedClsPrefix}-button__content`
      }, children2));
      return vue.h(Component, {
        ref: "selfElRef",
        class: [
          this.themeClass,
          `${mergedClsPrefix}-button`,
          `${mergedClsPrefix}-button--${this.type}-type`,
          `${mergedClsPrefix}-button--${this.mergedSize}-type`,
          this.rtlEnabled && `${mergedClsPrefix}-button--rtl`,
          this.disabled && `${mergedClsPrefix}-button--disabled`,
          this.block && `${mergedClsPrefix}-button--block`,
          this.enterPressed && `${mergedClsPrefix}-button--pressed`,
          !this.text && this.dashed && `${mergedClsPrefix}-button--dashed`,
          this.color && `${mergedClsPrefix}-button--color`,
          this.secondary && `${mergedClsPrefix}-button--secondary`,
          this.loading && `${mergedClsPrefix}-button--loading`,
          this.ghost && `${mergedClsPrefix}-button--ghost`
          // required for button group border collapse
        ],
        tabindex: this.mergedFocusable ? 0 : -1,
        type: this.attrType,
        style: this.cssVars,
        disabled: this.disabled,
        onClick: this.handleClick,
        onBlur: this.handleBlur,
        onMousedown: this.handleMousedown,
        onKeyup: this.handleKeyup,
        onKeydown: this.handleKeydown
      }, this.iconPlacement === "right" && children, vue.h(NFadeInExpandTransition, {
        width: true
      }, {
        default: () => resolveWrappedSlot(this.$slots.icon, (children2) => (this.loading || this.renderIcon || children2) && vue.h("span", {
          class: `${mergedClsPrefix}-button__icon`,
          style: {
            margin: isSlotEmpty(this.$slots.default) ? "0" : ""
          }
        }, vue.h(NIconSwitchTransition, null, {
          default: () => this.loading ? vue.h(NBaseLoading, {
            clsPrefix: mergedClsPrefix,
            key: "loading",
            class: `${mergedClsPrefix}-icon-slot`,
            strokeWidth: 20
          }) : vue.h("div", {
            key: "icon",
            class: `${mergedClsPrefix}-icon-slot`,
            role: "none"
          }, this.renderIcon ? this.renderIcon() : children2)
        })))
      }), this.iconPlacement === "left" && children, !this.text ? vue.h(NBaseWave, {
        ref: "waveElRef",
        clsPrefix: mergedClsPrefix
      }) : null, this.showBorder ? vue.h("div", {
        "aria-hidden": true,
        class: `${mergedClsPrefix}-button__border`,
        style: this.customColorCssVars
      }) : null, this.showBorder ? vue.h("div", {
        "aria-hidden": true,
        class: `${mergedClsPrefix}-button__state-border`,
        style: this.customColorCssVars
      }) : null);
    }
  });
  const NButton = Button;
  const commonVariables = {
    paddingSmall: "12px 16px 12px",
    paddingMedium: "19px 24px 20px",
    paddingLarge: "23px 32px 24px",
    paddingHuge: "27px 40px 28px",
    titleFontSizeSmall: "16px",
    titleFontSizeMedium: "18px",
    titleFontSizeLarge: "18px",
    titleFontSizeHuge: "18px",
    closeIconSize: "18px",
    closeSize: "22px"
  };
  const self$5 = (vars) => {
    const {
      primaryColor,
      borderRadius,
      lineHeight: lineHeight2,
      fontSize: fontSize2,
      cardColor,
      textColor2,
      textColor1,
      dividerColor,
      fontWeightStrong,
      closeIconColor,
      closeIconColorHover,
      closeIconColorPressed,
      closeColorHover,
      closeColorPressed,
      modalColor,
      boxShadow1,
      popoverColor,
      actionColor
    } = vars;
    return Object.assign(Object.assign({}, commonVariables), {
      lineHeight: lineHeight2,
      color: cardColor,
      colorModal: modalColor,
      colorPopover: popoverColor,
      colorTarget: primaryColor,
      colorEmbedded: actionColor,
      colorEmbeddedModal: actionColor,
      colorEmbeddedPopover: actionColor,
      textColor: textColor2,
      titleTextColor: textColor1,
      borderColor: dividerColor,
      actionColor,
      titleFontWeight: fontWeightStrong,
      closeColorHover,
      closeColorPressed,
      closeBorderRadius: borderRadius,
      closeIconColor,
      closeIconColorHover,
      closeIconColorPressed,
      fontSizeSmall: fontSize2,
      fontSizeMedium: fontSize2,
      fontSizeLarge: fontSize2,
      fontSizeHuge: fontSize2,
      boxShadow: boxShadow1,
      borderRadius
    });
  };
  const cardLight = {
    name: "Card",
    common: commonLight,
    self: self$5
  };
  const cardLight$1 = cardLight;
  const style$4 = c([cB("card", `
 font-size: var(--n-font-size);
 line-height: var(--n-line-height);
 display: flex;
 flex-direction: column;
 width: 100%;
 box-sizing: border-box;
 position: relative;
 border-radius: var(--n-border-radius);
 background-color: var(--n-color);
 color: var(--n-text-color);
 word-break: break-word;
 transition: 
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `, [asModal({
    background: "var(--n-color-modal)"
  }), cM("hoverable", [c("&:hover", "box-shadow: var(--n-box-shadow);")]), cM("content-segmented", [c(">", [cE("content", {
    paddingTop: "var(--n-padding-bottom)"
  })])]), cM("content-soft-segmented", [c(">", [cE("content", `
 margin: 0 var(--n-padding-left);
 padding: var(--n-padding-bottom) 0;
 `)])]), cM("footer-segmented", [c(">", [cE("footer", {
    paddingTop: "var(--n-padding-bottom)"
  })])]), cM("footer-soft-segmented", [c(">", [cE("footer", `
 padding: var(--n-padding-bottom) 0;
 margin: 0 var(--n-padding-left);
 `)])]), c(">", [cB("card-header", `
 box-sizing: border-box;
 display: flex;
 align-items: center;
 font-size: var(--n-title-font-size);
 padding:
 var(--n-padding-top)
 var(--n-padding-left)
 var(--n-padding-bottom)
 var(--n-padding-left);
 `, [cE("main", `
 font-weight: var(--n-title-font-weight);
 transition: color .3s var(--n-bezier);
 flex: 1;
 min-width: 0;
 color: var(--n-title-text-color);
 `), cE("extra", `
 display: flex;
 align-items: center;
 font-size: var(--n-font-size);
 font-weight: 400;
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 `), cE("close", `
 margin: 0 0 0 8px;
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `)]), cE("action", `
 box-sizing: border-box;
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 background-clip: padding-box;
 background-color: var(--n-action-color);
 `), cE("content", "flex: 1; min-width: 0;"), cE("content, footer", `
 box-sizing: border-box;
 padding: 0 var(--n-padding-left) var(--n-padding-bottom) var(--n-padding-left);
 font-size: var(--n-font-size);
 `, [c("&:first-child", {
    paddingTop: "var(--n-padding-bottom)"
  })]), cE("action", `
 background-color: var(--n-action-color);
 padding: var(--n-padding-bottom) var(--n-padding-left);
 border-bottom-left-radius: var(--n-border-radius);
 border-bottom-right-radius: var(--n-border-radius);
 `)]), cB("card-cover", `
 overflow: hidden;
 width: 100%;
 border-radius: var(--n-border-radius) var(--n-border-radius) 0 0;
 `, [c("img", `
 display: block;
 width: 100%;
 `)]), cM("bordered", `
 border: 1px solid var(--n-border-color);
 `, [c("&:target", "border-color: var(--n-color-target);")]), cM("action-segmented", [c(">", [cE("action", [c("&:not(:first-child)", {
    borderTop: "1px solid var(--n-border-color)"
  })])])]), cM("content-segmented, content-soft-segmented", [c(">", [cE("content", {
    transition: "border-color 0.3s var(--n-bezier)"
  }, [c("&:not(:first-child)", {
    borderTop: "1px solid var(--n-border-color)"
  })])])]), cM("footer-segmented, footer-soft-segmented", [c(">", [cE("footer", {
    transition: "border-color 0.3s var(--n-bezier)"
  }, [c("&:not(:first-child)", {
    borderTop: "1px solid var(--n-border-color)"
  })])])]), cM("embedded", `
 background-color: var(--n-color-embedded);
 `)]), insideModal(cB("card", `
 background: var(--n-color-modal);
 `, [cM("embedded", `
 background-color: var(--n-color-embedded-modal);
 `)])), insidePopover(cB("card", `
 background: var(--n-color-popover);
 `, [cM("embedded", `
 background-color: var(--n-color-embedded-popover);
 `)]))]);
  const cardBaseProps = {
    title: String,
    contentClass: String,
    contentStyle: [Object, String],
    headerClass: String,
    headerStyle: [Object, String],
    headerExtraClass: String,
    headerExtraStyle: [Object, String],
    footerClass: String,
    footerStyle: [Object, String],
    embedded: Boolean,
    segmented: {
      type: [Boolean, Object],
      default: false
    },
    size: {
      type: String,
      default: "medium"
    },
    bordered: {
      type: Boolean,
      default: true
    },
    closable: Boolean,
    hoverable: Boolean,
    role: String,
    onClose: [Function, Array],
    tag: {
      type: String,
      default: "div"
    }
  };
  const cardBasePropKeys = keysOf(cardBaseProps);
  const cardProps = Object.assign(Object.assign({}, useTheme.props), cardBaseProps);
  const NCard = vue.defineComponent({
    name: "Card",
    props: cardProps,
    setup(props) {
      const handleCloseClick = () => {
        const {
          onClose
        } = props;
        if (onClose)
          call(onClose);
      };
      const {
        inlineThemeDisabled,
        mergedClsPrefixRef,
        mergedRtlRef
      } = useConfig(props);
      const themeRef = useTheme("Card", "-card", style$4, cardLight$1, props, mergedClsPrefixRef);
      const rtlEnabledRef = useRtl("Card", mergedRtlRef, mergedClsPrefixRef);
      const cssVarsRef = vue.computed(() => {
        const {
          size: size2
        } = props;
        const {
          self: {
            color,
            colorModal,
            colorTarget,
            textColor,
            titleTextColor,
            titleFontWeight,
            borderColor,
            actionColor,
            borderRadius,
            lineHeight: lineHeight2,
            closeIconColor,
            closeIconColorHover,
            closeIconColorPressed,
            closeColorHover,
            closeColorPressed,
            closeBorderRadius,
            closeIconSize,
            closeSize,
            boxShadow,
            colorPopover,
            colorEmbedded,
            colorEmbeddedModal,
            colorEmbeddedPopover,
            [createKey("padding", size2)]: padding,
            [createKey("fontSize", size2)]: fontSize2,
            [createKey("titleFontSize", size2)]: titleFontSize
          },
          common: {
            cubicBezierEaseInOut: cubicBezierEaseInOut2
          }
        } = themeRef.value;
        const {
          top: paddingTop,
          left: paddingLeft,
          bottom: paddingBottom
        } = getMargin(padding);
        return {
          "--n-bezier": cubicBezierEaseInOut2,
          "--n-border-radius": borderRadius,
          "--n-color": color,
          "--n-color-modal": colorModal,
          "--n-color-popover": colorPopover,
          "--n-color-embedded": colorEmbedded,
          "--n-color-embedded-modal": colorEmbeddedModal,
          "--n-color-embedded-popover": colorEmbeddedPopover,
          "--n-color-target": colorTarget,
          "--n-text-color": textColor,
          "--n-line-height": lineHeight2,
          "--n-action-color": actionColor,
          "--n-title-text-color": titleTextColor,
          "--n-title-font-weight": titleFontWeight,
          "--n-close-icon-color": closeIconColor,
          "--n-close-icon-color-hover": closeIconColorHover,
          "--n-close-icon-color-pressed": closeIconColorPressed,
          "--n-close-color-hover": closeColorHover,
          "--n-close-color-pressed": closeColorPressed,
          "--n-border-color": borderColor,
          "--n-box-shadow": boxShadow,
          // size
          "--n-padding-top": paddingTop,
          "--n-padding-bottom": paddingBottom,
          "--n-padding-left": paddingLeft,
          "--n-font-size": fontSize2,
          "--n-title-font-size": titleFontSize,
          "--n-close-size": closeSize,
          "--n-close-icon-size": closeIconSize,
          "--n-close-border-radius": closeBorderRadius
        };
      });
      const themeClassHandle = inlineThemeDisabled ? useThemeClass("card", vue.computed(() => {
        return props.size[0];
      }), cssVarsRef, props) : void 0;
      return {
        rtlEnabled: rtlEnabledRef,
        mergedClsPrefix: mergedClsPrefixRef,
        mergedTheme: themeRef,
        handleCloseClick,
        cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
        themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
        onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender
      };
    },
    render() {
      const {
        segmented,
        bordered,
        hoverable,
        mergedClsPrefix,
        rtlEnabled,
        onRender,
        embedded,
        tag: Component,
        $slots
      } = this;
      onRender === null || onRender === void 0 ? void 0 : onRender();
      return vue.h(Component, {
        class: [`${mergedClsPrefix}-card`, this.themeClass, embedded && `${mergedClsPrefix}-card--embedded`, {
          [`${mergedClsPrefix}-card--rtl`]: rtlEnabled,
          [`${mergedClsPrefix}-card--content${typeof segmented !== "boolean" && segmented.content === "soft" ? "-soft" : ""}-segmented`]: segmented === true || segmented !== false && segmented.content,
          [`${mergedClsPrefix}-card--footer${typeof segmented !== "boolean" && segmented.footer === "soft" ? "-soft" : ""}-segmented`]: segmented === true || segmented !== false && segmented.footer,
          [`${mergedClsPrefix}-card--action-segmented`]: segmented === true || segmented !== false && segmented.action,
          [`${mergedClsPrefix}-card--bordered`]: bordered,
          [`${mergedClsPrefix}-card--hoverable`]: hoverable
        }],
        style: this.cssVars,
        role: this.role
      }, resolveWrappedSlot($slots.cover, (children) => children && vue.h("div", {
        class: `${mergedClsPrefix}-card-cover`,
        role: "none"
      }, children)), resolveWrappedSlot($slots.header, (children) => {
        return children || this.title || this.closable ? vue.h("div", {
          class: [`${mergedClsPrefix}-card-header`, this.headerClass],
          style: this.headerStyle
        }, vue.h("div", {
          class: `${mergedClsPrefix}-card-header__main`,
          role: "heading"
        }, children || this.title), resolveWrappedSlot($slots["header-extra"], (children2) => children2 && vue.h("div", {
          class: [`${mergedClsPrefix}-card-header__extra`, this.headerExtraClass],
          style: this.headerExtraStyle
        }, children2)), this.closable ? vue.h(NBaseClose, {
          clsPrefix: mergedClsPrefix,
          class: `${mergedClsPrefix}-card-header__close`,
          onClick: this.handleCloseClick,
          absolute: true
        }) : null) : null;
      }), resolveWrappedSlot($slots.default, (children) => children && vue.h("div", {
        class: [`${mergedClsPrefix}-card__content`, this.contentClass],
        style: this.contentStyle,
        role: "none"
      }, children)), resolveWrappedSlot($slots.footer, (children) => children && [vue.h("div", {
        class: [`${mergedClsPrefix}-card__footer`, this.footerClass],
        style: this.footerStyle,
        role: "none"
      }, children)]), resolveWrappedSlot($slots.action, (children) => children && vue.h("div", {
        class: `${mergedClsPrefix}-card__action`,
        role: "none"
      }, children)));
    }
  });
  const commonVars$2 = {
    titleFontSize: "18px",
    padding: "16px 28px 20px 28px",
    iconSize: "28px",
    actionSpace: "12px",
    contentMargin: "8px 0 16px 0",
    iconMargin: "0 4px 0 0",
    iconMarginIconTop: "4px 0 8px 0",
    closeSize: "22px",
    closeIconSize: "18px",
    closeMargin: "20px 26px 0 0",
    closeMarginIconTop: "10px 16px 0 0"
  };
  const self$4 = (vars) => {
    const {
      textColor1,
      textColor2,
      modalColor,
      closeIconColor,
      closeIconColorHover,
      closeIconColorPressed,
      closeColorHover,
      closeColorPressed,
      infoColor,
      successColor,
      warningColor,
      errorColor,
      primaryColor,
      dividerColor,
      borderRadius,
      fontWeightStrong,
      lineHeight: lineHeight2,
      fontSize: fontSize2
    } = vars;
    return Object.assign(Object.assign({}, commonVars$2), {
      fontSize: fontSize2,
      lineHeight: lineHeight2,
      border: `1px solid ${dividerColor}`,
      titleTextColor: textColor1,
      textColor: textColor2,
      color: modalColor,
      closeColorHover,
      closeColorPressed,
      closeIconColor,
      closeIconColorHover,
      closeIconColorPressed,
      closeBorderRadius: borderRadius,
      iconColor: primaryColor,
      iconColorInfo: infoColor,
      iconColorSuccess: successColor,
      iconColorWarning: warningColor,
      iconColorError: errorColor,
      borderRadius,
      titleFontWeight: fontWeightStrong
    });
  };
  const dialogLight = createTheme({
    name: "Dialog",
    common: commonLight,
    peers: {
      Button: buttonLight$1
    },
    self: self$4
  });
  const dialogLight$1 = dialogLight;
  const dialogProps = {
    icon: Function,
    type: {
      type: String,
      default: "default"
    },
    title: [String, Function],
    closable: {
      type: Boolean,
      default: true
    },
    negativeText: String,
    positiveText: String,
    positiveButtonProps: Object,
    negativeButtonProps: Object,
    content: [String, Function],
    action: Function,
    showIcon: {
      type: Boolean,
      default: true
    },
    loading: Boolean,
    bordered: Boolean,
    iconPlacement: String,
    onPositiveClick: Function,
    onNegativeClick: Function,
    onClose: Function
  };
  const dialogPropKeys = keysOf(dialogProps);
  const style$3 = c([cB("dialog", `
 --n-icon-margin: var(--n-icon-margin-top) var(--n-icon-margin-right) var(--n-icon-margin-bottom) var(--n-icon-margin-left);
 word-break: break-word;
 line-height: var(--n-line-height);
 position: relative;
 background: var(--n-color);
 color: var(--n-text-color);
 box-sizing: border-box;
 margin: auto;
 border-radius: var(--n-border-radius);
 padding: var(--n-padding);
 transition: 
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `, [cE("icon", {
    color: "var(--n-icon-color)"
  }), cM("bordered", {
    border: "var(--n-border)"
  }), cM("icon-top", [cE("close", {
    margin: "var(--n-close-margin)"
  }), cE("icon", {
    margin: "var(--n-icon-margin)"
  }), cE("content", {
    textAlign: "center"
  }), cE("title", {
    justifyContent: "center"
  }), cE("action", {
    justifyContent: "center"
  })]), cM("icon-left", [cE("icon", {
    margin: "var(--n-icon-margin)"
  }), cM("closable", [cE("title", `
 padding-right: calc(var(--n-close-size) + 6px);
 `)])]), cE("close", `
 position: absolute;
 right: 0;
 top: 0;
 margin: var(--n-close-margin);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 z-index: 1;
 `), cE("content", `
 font-size: var(--n-font-size);
 margin: var(--n-content-margin);
 position: relative;
 word-break: break-word;
 `, [cM("last", "margin-bottom: 0;")]), cE("action", `
 display: flex;
 justify-content: flex-end;
 `, [c("> *:not(:last-child)", `
 margin-right: var(--n-action-space);
 `)]), cE("icon", `
 font-size: var(--n-icon-size);
 transition: color .3s var(--n-bezier);
 `), cE("title", `
 transition: color .3s var(--n-bezier);
 display: flex;
 align-items: center;
 font-size: var(--n-title-font-size);
 font-weight: var(--n-title-font-weight);
 color: var(--n-title-text-color);
 `), cB("dialog-icon-container", `
 display: flex;
 justify-content: center;
 `)]), insideModal(cB("dialog", `
 width: 446px;
 max-width: calc(100vw - 32px);
 `)), cB("dialog", [asModal(`
 width: 446px;
 max-width: calc(100vw - 32px);
 `)])]);
  const iconRenderMap = {
    default: () => vue.h(InfoIcon, null),
    info: () => vue.h(InfoIcon, null),
    success: () => vue.h(SuccessIcon, null),
    warning: () => vue.h(WarningIcon, null),
    error: () => vue.h(ErrorIcon, null)
  };
  const NDialog = vue.defineComponent({
    name: "Dialog",
    alias: [
      "NimbusConfirmCard",
      // deprecated
      "Confirm"
      // deprecated
    ],
    props: Object.assign(Object.assign({}, useTheme.props), dialogProps),
    setup(props) {
      const {
        mergedComponentPropsRef,
        mergedClsPrefixRef,
        inlineThemeDisabled,
        mergedRtlRef
      } = useConfig(props);
      const rtlEnabledRef = useRtl("Dialog", mergedRtlRef, mergedClsPrefixRef);
      const mergedIconPlacementRef = vue.computed(() => {
        var _a, _b;
        const {
          iconPlacement
        } = props;
        return iconPlacement || ((_b = (_a = mergedComponentPropsRef === null || mergedComponentPropsRef === void 0 ? void 0 : mergedComponentPropsRef.value) === null || _a === void 0 ? void 0 : _a.Dialog) === null || _b === void 0 ? void 0 : _b.iconPlacement) || "left";
      });
      function handlePositiveClick(e2) {
        const {
          onPositiveClick
        } = props;
        if (onPositiveClick)
          onPositiveClick(e2);
      }
      function handleNegativeClick(e2) {
        const {
          onNegativeClick
        } = props;
        if (onNegativeClick)
          onNegativeClick(e2);
      }
      function handleCloseClick() {
        const {
          onClose
        } = props;
        if (onClose)
          onClose();
      }
      const themeRef = useTheme("Dialog", "-dialog", style$3, dialogLight$1, props, mergedClsPrefixRef);
      const cssVarsRef = vue.computed(() => {
        const {
          type: type2
        } = props;
        const iconPlacement = mergedIconPlacementRef.value;
        const {
          common: {
            cubicBezierEaseInOut: cubicBezierEaseInOut2
          },
          self: {
            fontSize: fontSize2,
            lineHeight: lineHeight2,
            border,
            titleTextColor,
            textColor,
            color,
            closeBorderRadius,
            closeColorHover,
            closeColorPressed,
            closeIconColor,
            closeIconColorHover,
            closeIconColorPressed,
            closeIconSize,
            borderRadius,
            titleFontWeight,
            titleFontSize,
            padding,
            iconSize,
            actionSpace,
            contentMargin,
            closeSize,
            [iconPlacement === "top" ? "iconMarginIconTop" : "iconMargin"]: iconMargin,
            [iconPlacement === "top" ? "closeMarginIconTop" : "closeMargin"]: closeMargin,
            [createKey("iconColor", type2)]: iconColor
          }
        } = themeRef.value;
        const iconMarginDiscrete = getMargin(iconMargin);
        return {
          "--n-font-size": fontSize2,
          "--n-icon-color": iconColor,
          "--n-bezier": cubicBezierEaseInOut2,
          "--n-close-margin": closeMargin,
          "--n-icon-margin-top": iconMarginDiscrete.top,
          "--n-icon-margin-right": iconMarginDiscrete.right,
          "--n-icon-margin-bottom": iconMarginDiscrete.bottom,
          "--n-icon-margin-left": iconMarginDiscrete.left,
          "--n-icon-size": iconSize,
          "--n-close-size": closeSize,
          "--n-close-icon-size": closeIconSize,
          "--n-close-border-radius": closeBorderRadius,
          "--n-close-color-hover": closeColorHover,
          "--n-close-color-pressed": closeColorPressed,
          "--n-close-icon-color": closeIconColor,
          "--n-close-icon-color-hover": closeIconColorHover,
          "--n-close-icon-color-pressed": closeIconColorPressed,
          "--n-color": color,
          "--n-text-color": textColor,
          "--n-border-radius": borderRadius,
          "--n-padding": padding,
          "--n-line-height": lineHeight2,
          "--n-border": border,
          "--n-content-margin": contentMargin,
          "--n-title-font-size": titleFontSize,
          "--n-title-font-weight": titleFontWeight,
          "--n-title-text-color": titleTextColor,
          "--n-action-space": actionSpace
        };
      });
      const themeClassHandle = inlineThemeDisabled ? useThemeClass("dialog", vue.computed(() => `${props.type[0]}${mergedIconPlacementRef.value[0]}`), cssVarsRef, props) : void 0;
      return {
        mergedClsPrefix: mergedClsPrefixRef,
        rtlEnabled: rtlEnabledRef,
        mergedIconPlacement: mergedIconPlacementRef,
        mergedTheme: themeRef,
        handlePositiveClick,
        handleNegativeClick,
        handleCloseClick,
        cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
        themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
        onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender
      };
    },
    render() {
      var _a;
      const {
        bordered,
        mergedIconPlacement,
        cssVars,
        closable,
        showIcon,
        title,
        content,
        action,
        negativeText,
        positiveText,
        positiveButtonProps,
        negativeButtonProps,
        handlePositiveClick,
        handleNegativeClick,
        mergedTheme,
        loading,
        type: type2,
        mergedClsPrefix
      } = this;
      (_a = this.onRender) === null || _a === void 0 ? void 0 : _a.call(this);
      const icon = showIcon ? vue.h(NBaseIcon, {
        clsPrefix: mergedClsPrefix,
        class: `${mergedClsPrefix}-dialog__icon`
      }, {
        default: () => resolveWrappedSlot(this.$slots.icon, (children) => children || (this.icon ? render$1(this.icon) : iconRenderMap[this.type]()))
      }) : null;
      const actionNode = resolveWrappedSlot(this.$slots.action, (children) => children || positiveText || negativeText || action ? vue.h("div", {
        class: `${mergedClsPrefix}-dialog__action`
      }, children || (action ? [render$1(action)] : [this.negativeText && vue.h(NButton, Object.assign({
        theme: mergedTheme.peers.Button,
        themeOverrides: mergedTheme.peerOverrides.Button,
        ghost: true,
        size: "small",
        onClick: handleNegativeClick
      }, negativeButtonProps), {
        default: () => render$1(this.negativeText)
      }), this.positiveText && vue.h(NButton, Object.assign({
        theme: mergedTheme.peers.Button,
        themeOverrides: mergedTheme.peerOverrides.Button,
        size: "small",
        type: type2 === "default" ? "primary" : type2,
        disabled: loading,
        loading,
        onClick: handlePositiveClick
      }, positiveButtonProps), {
        default: () => render$1(this.positiveText)
      })])) : null);
      return vue.h("div", {
        class: [`${mergedClsPrefix}-dialog`, this.themeClass, this.closable && `${mergedClsPrefix}-dialog--closable`, `${mergedClsPrefix}-dialog--icon-${mergedIconPlacement}`, bordered && `${mergedClsPrefix}-dialog--bordered`, this.rtlEnabled && `${mergedClsPrefix}-dialog--rtl`],
        style: cssVars,
        role: "dialog"
      }, closable ? resolveWrappedSlot(this.$slots.close, (node) => {
        const classNames = [`${mergedClsPrefix}-dialog__close`, this.rtlEnabled && `${mergedClsPrefix}-dialog--rtl`];
        return node ? vue.h("div", {
          class: classNames
        }, node) : vue.h(NBaseClose, {
          clsPrefix: mergedClsPrefix,
          class: classNames,
          onClick: this.handleCloseClick
        });
      }) : null, showIcon && mergedIconPlacement === "top" ? vue.h("div", {
        class: `${mergedClsPrefix}-dialog-icon-container`
      }, icon) : null, vue.h("div", {
        class: `${mergedClsPrefix}-dialog__title`
      }, showIcon && mergedIconPlacement === "left" ? icon : null, resolveSlot(this.$slots.header, () => [render$1(title)])), vue.h("div", {
        class: [`${mergedClsPrefix}-dialog__content`, actionNode ? "" : `${mergedClsPrefix}-dialog__content--last`]
      }, resolveSlot(this.$slots.default, () => [render$1(content)])), actionNode);
    }
  });
  const dialogProviderInjectionKey = createInjectionKey("n-dialog-provider");
  const self$3 = (vars) => {
    const {
      modalColor,
      textColor2,
      boxShadow3
    } = vars;
    return {
      color: modalColor,
      textColor: textColor2,
      boxShadow: boxShadow3
    };
  };
  const modalLight = createTheme({
    name: "Modal",
    common: commonLight,
    peers: {
      Scrollbar: scrollbarLight$1,
      Dialog: dialogLight$1,
      Card: cardLight$1
    },
    self: self$3
  });
  const modalLight$1 = modalLight;
  const presetProps = Object.assign(Object.assign({}, cardBaseProps), dialogProps);
  const presetPropsKeys = keysOf(presetProps);
  const NModalBodyWrapper = vue.defineComponent({
    name: "ModalBody",
    inheritAttrs: false,
    props: Object.assign(Object.assign({
      show: {
        type: Boolean,
        required: true
      },
      preset: String,
      displayDirective: {
        type: String,
        required: true
      },
      trapFocus: {
        type: Boolean,
        default: true
      },
      autoFocus: {
        type: Boolean,
        default: true
      },
      blockScroll: Boolean
    }, presetProps), {
      renderMask: Function,
      // events
      onClickoutside: Function,
      onBeforeLeave: {
        type: Function,
        required: true
      },
      onAfterLeave: {
        type: Function,
        required: true
      },
      onPositiveClick: {
        type: Function,
        required: true
      },
      onNegativeClick: {
        type: Function,
        required: true
      },
      onClose: {
        type: Function,
        required: true
      },
      onAfterEnter: Function,
      onEsc: Function
    }),
    setup(props) {
      const bodyRef = vue.ref(null);
      const scrollbarRef = vue.ref(null);
      const displayedRef = vue.ref(props.show);
      const transformOriginXRef = vue.ref(null);
      const transformOriginYRef = vue.ref(null);
      vue.watch(vue.toRef(props, "show"), (value2) => {
        if (value2)
          displayedRef.value = true;
      });
      useLockHtmlScroll(vue.computed(() => props.blockScroll && displayedRef.value));
      const NModal2 = vue.inject(modalInjectionKey);
      function styleTransformOrigin() {
        if (NModal2.transformOriginRef.value === "center") {
          return "";
        }
        const {
          value: transformOriginX
        } = transformOriginXRef;
        const {
          value: transformOriginY
        } = transformOriginYRef;
        if (transformOriginX === null || transformOriginY === null) {
          return "";
        } else if (scrollbarRef.value) {
          const scrollTop = scrollbarRef.value.containerScrollTop;
          return `${transformOriginX}px ${transformOriginY + scrollTop}px`;
        }
        return "";
      }
      function syncTransformOrigin(el) {
        if (NModal2.transformOriginRef.value === "center") {
          return;
        }
        const mousePosition = NModal2.getMousePosition();
        if (!mousePosition) {
          return;
        }
        if (!scrollbarRef.value)
          return;
        const scrollTop = scrollbarRef.value.containerScrollTop;
        const {
          offsetLeft,
          offsetTop
        } = el;
        if (mousePosition) {
          const top = mousePosition.y;
          const left = mousePosition.x;
          transformOriginXRef.value = -(offsetLeft - left);
          transformOriginYRef.value = -(offsetTop - top - scrollTop);
        }
        el.style.transformOrigin = styleTransformOrigin();
      }
      function handleEnter(el) {
        void vue.nextTick(() => {
          syncTransformOrigin(el);
        });
      }
      function handleBeforeLeave(el) {
        el.style.transformOrigin = styleTransformOrigin();
        props.onBeforeLeave();
      }
      function handleAfterLeave() {
        displayedRef.value = false;
        transformOriginXRef.value = null;
        transformOriginYRef.value = null;
        props.onAfterLeave();
      }
      function handleCloseClick() {
        const {
          onClose
        } = props;
        if (onClose) {
          onClose();
        }
      }
      function handleNegativeClick() {
        props.onNegativeClick();
      }
      function handlePositiveClick() {
        props.onPositiveClick();
      }
      const childNodeRef = vue.ref(null);
      vue.watch(childNodeRef, (node) => {
        if (node) {
          void vue.nextTick(() => {
            const el = node.el;
            if (el && bodyRef.value !== el) {
              bodyRef.value = el;
            }
          });
        }
      });
      vue.provide(modalBodyInjectionKey, bodyRef);
      vue.provide(drawerBodyInjectionKey, null);
      vue.provide(popoverBodyInjectionKey, null);
      return {
        mergedTheme: NModal2.mergedThemeRef,
        appear: NModal2.appearRef,
        isMounted: NModal2.isMountedRef,
        mergedClsPrefix: NModal2.mergedClsPrefixRef,
        bodyRef,
        scrollbarRef,
        displayed: displayedRef,
        childNodeRef,
        handlePositiveClick,
        handleNegativeClick,
        handleCloseClick,
        handleAfterLeave,
        handleBeforeLeave,
        handleEnter
      };
    },
    render() {
      const {
        $slots,
        $attrs,
        handleEnter,
        handleAfterLeave,
        handleBeforeLeave,
        preset,
        mergedClsPrefix
      } = this;
      let childNode = null;
      if (!preset) {
        childNode = getFirstSlotVNode($slots);
        if (!childNode) {
          warn$2("modal", "default slot is empty");
          return;
        }
        childNode = vue.cloneVNode(childNode);
        childNode.props = vue.mergeProps({
          class: `${mergedClsPrefix}-modal`
        }, $attrs, childNode.props || {});
      }
      return this.displayDirective === "show" || this.displayed || this.show ? vue.withDirectives(vue.h("div", {
        role: "none",
        class: `${mergedClsPrefix}-modal-body-wrapper`
      }, vue.h(NScrollbar, {
        ref: "scrollbarRef",
        theme: this.mergedTheme.peers.Scrollbar,
        themeOverrides: this.mergedTheme.peerOverrides.Scrollbar,
        contentClass: `${mergedClsPrefix}-modal-scroll-content`
      }, {
        default: () => {
          var _a;
          return [(_a = this.renderMask) === null || _a === void 0 ? void 0 : _a.call(this), vue.h(FocusTrap, {
            disabled: !this.trapFocus,
            active: this.show,
            onEsc: this.onEsc,
            autoFocus: this.autoFocus
          }, {
            default: () => {
              var _a2;
              return vue.h(vue.Transition, {
                name: "fade-in-scale-up-transition",
                appear: (_a2 = this.appear) !== null && _a2 !== void 0 ? _a2 : this.isMounted,
                onEnter: handleEnter,
                onAfterEnter: this.onAfterEnter,
                onAfterLeave: handleAfterLeave,
                onBeforeLeave: handleBeforeLeave
              }, {
                default: () => {
                  const dirs = [[vue.vShow, this.show]];
                  const {
                    onClickoutside
                  } = this;
                  if (onClickoutside) {
                    dirs.push([clickoutside$1, this.onClickoutside, void 0, {
                      capture: true
                    }]);
                  }
                  return vue.withDirectives(this.preset === "confirm" || this.preset === "dialog" ? vue.h(NDialog, Object.assign({}, this.$attrs, {
                    class: [`${mergedClsPrefix}-modal`, this.$attrs.class],
                    ref: "bodyRef",
                    theme: this.mergedTheme.peers.Dialog,
                    themeOverrides: this.mergedTheme.peerOverrides.Dialog
                  }, keep(this.$props, dialogPropKeys), {
                    "aria-modal": "true"
                  }), $slots) : this.preset === "card" ? vue.h(NCard, Object.assign({}, this.$attrs, {
                    ref: "bodyRef",
                    class: [`${mergedClsPrefix}-modal`, this.$attrs.class],
                    theme: this.mergedTheme.peers.Card,
                    themeOverrides: this.mergedTheme.peerOverrides.Card
                  }, keep(this.$props, cardBasePropKeys), {
                    "aria-modal": "true",
                    role: "dialog"
                  }), $slots) : this.childNodeRef = childNode, dirs);
                }
              });
            }
          })];
        }
      })), [[vue.vShow, this.displayDirective === "if" || this.displayed || this.show]]) : null;
    }
  });
  const style$2 = c([cB("modal-container", `
 position: fixed;
 left: 0;
 top: 0;
 height: 0;
 width: 0;
 display: flex;
 `), cB("modal-mask", `
 position: fixed;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 background-color: rgba(0, 0, 0, .4);
 `, [fadeInTransition({
    enterDuration: ".25s",
    leaveDuration: ".25s",
    enterCubicBezier: "var(--n-bezier-ease-out)",
    leaveCubicBezier: "var(--n-bezier-ease-out)"
  })]), cB("modal-body-wrapper", `
 position: fixed;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 overflow: visible;
 `, [cB("modal-scroll-content", `
 min-height: 100%;
 display: flex;
 position: relative;
 `)]), cB("modal", `
 position: relative;
 align-self: center;
 color: var(--n-text-color);
 margin: auto;
 box-shadow: var(--n-box-shadow);
 `, [fadeInScaleUpTransition({
    duration: ".25s",
    enterScale: ".5"
  })])]);
  const modalProps = Object.assign(Object.assign(Object.assign(Object.assign({}, useTheme.props), {
    show: Boolean,
    unstableShowMask: {
      type: Boolean,
      default: true
    },
    maskClosable: {
      type: Boolean,
      default: true
    },
    preset: String,
    to: [String, Object],
    displayDirective: {
      type: String,
      default: "if"
    },
    transformOrigin: {
      type: String,
      default: "mouse"
    },
    zIndex: Number,
    autoFocus: {
      type: Boolean,
      default: true
    },
    trapFocus: {
      type: Boolean,
      default: true
    },
    closeOnEsc: {
      type: Boolean,
      default: true
    },
    blockScroll: {
      type: Boolean,
      default: true
    }
  }), presetProps), {
    // events
    onEsc: Function,
    "onUpdate:show": [Function, Array],
    onUpdateShow: [Function, Array],
    onAfterEnter: Function,
    onBeforeLeave: Function,
    onAfterLeave: Function,
    onClose: Function,
    onPositiveClick: Function,
    onNegativeClick: Function,
    onMaskClick: Function,
    // private
    internalDialog: Boolean,
    internalModal: Boolean,
    internalAppear: {
      type: Boolean,
      default: void 0
    },
    // deprecated
    overlayStyle: [String, Object],
    onBeforeHide: Function,
    onAfterHide: Function,
    onHide: Function
  });
  const NModal = vue.defineComponent({
    name: "Modal",
    inheritAttrs: false,
    props: modalProps,
    setup(props) {
      if (process.env.NODE_ENV !== "production") {
        if (props.onHide) {
          warnOnce("modal", "`on-hide` is deprecated.");
        }
        if (props.onAfterHide) {
          warnOnce("modal", "`on-after-hide` is deprecated, please use `on-after-leave` instead.");
        }
        if (props.onBeforeHide) {
          warnOnce("modal", "`on-before-hide` is deprecated, please use `on-before-leave` instead.");
        }
        if (props.overlayStyle) {
          warnOnce("modal", "`overlay-style` is deprecated, please use `style` instead.");
        }
      }
      const containerRef = vue.ref(null);
      const {
        mergedClsPrefixRef,
        namespaceRef,
        inlineThemeDisabled
      } = useConfig(props);
      const themeRef = useTheme("Modal", "-modal", style$2, modalLight$1, props, mergedClsPrefixRef);
      const clickedRef = useClicked(64);
      const clickedPositionRef = useClickPosition();
      const isMountedRef = isMounted();
      const NDialogProvider = props.internalDialog ? vue.inject(dialogProviderInjectionKey, null) : null;
      const NModalProvider = props.internalModal ? vue.inject(modalProviderInjectionKey, null) : null;
      const isComposingRef2 = useIsComposing();
      function doUpdateShow(show) {
        const {
          onUpdateShow,
          "onUpdate:show": _onUpdateShow,
          onHide
        } = props;
        if (onUpdateShow)
          call(onUpdateShow, show);
        if (_onUpdateShow)
          call(_onUpdateShow, show);
        if (onHide && !show)
          onHide(show);
      }
      function handleCloseClick() {
        const {
          onClose
        } = props;
        if (onClose) {
          void Promise.resolve(onClose()).then((value2) => {
            if (value2 === false)
              return;
            doUpdateShow(false);
          });
        } else {
          doUpdateShow(false);
        }
      }
      function handlePositiveClick() {
        const {
          onPositiveClick
        } = props;
        if (onPositiveClick) {
          void Promise.resolve(onPositiveClick()).then((value2) => {
            if (value2 === false)
              return;
            doUpdateShow(false);
          });
        } else {
          doUpdateShow(false);
        }
      }
      function handleNegativeClick() {
        const {
          onNegativeClick
        } = props;
        if (onNegativeClick) {
          void Promise.resolve(onNegativeClick()).then((value2) => {
            if (value2 === false)
              return;
            doUpdateShow(false);
          });
        } else {
          doUpdateShow(false);
        }
      }
      function handleBeforeLeave() {
        const {
          onBeforeLeave,
          onBeforeHide
        } = props;
        if (onBeforeLeave)
          call(onBeforeLeave);
        if (onBeforeHide)
          onBeforeHide();
      }
      function handleAfterLeave() {
        const {
          onAfterLeave,
          onAfterHide
        } = props;
        if (onAfterLeave)
          call(onAfterLeave);
        if (onAfterHide)
          onAfterHide();
      }
      function handleClickoutside(e2) {
        var _a;
        const {
          onMaskClick
        } = props;
        if (onMaskClick) {
          onMaskClick(e2);
        }
        if (props.maskClosable) {
          if ((_a = containerRef.value) === null || _a === void 0 ? void 0 : _a.contains(getPreciseEventTarget(e2))) {
            doUpdateShow(false);
          }
        }
      }
      function handleEsc(e2) {
        var _a;
        (_a = props.onEsc) === null || _a === void 0 ? void 0 : _a.call(props);
        if (props.show && props.closeOnEsc && eventEffectNotPerformed(e2)) {
          !isComposingRef2.value && doUpdateShow(false);
        }
      }
      vue.provide(modalInjectionKey, {
        getMousePosition: () => {
          const mergedProvider = NDialogProvider || NModalProvider;
          if (mergedProvider) {
            const {
              clickedRef: clickedRef2,
              clickedPositionRef: clickedPositionRef2
            } = mergedProvider;
            if (clickedRef2.value && clickedPositionRef2.value) {
              return clickedPositionRef2.value;
            }
          }
          if (clickedRef.value) {
            return clickedPositionRef.value;
          }
          return null;
        },
        mergedClsPrefixRef,
        mergedThemeRef: themeRef,
        isMountedRef,
        appearRef: vue.toRef(props, "internalAppear"),
        transformOriginRef: vue.toRef(props, "transformOrigin")
      });
      const cssVarsRef = vue.computed(() => {
        const {
          common: {
            cubicBezierEaseOut: cubicBezierEaseOut2
          },
          self: {
            boxShadow,
            color,
            textColor
          }
        } = themeRef.value;
        return {
          "--n-bezier-ease-out": cubicBezierEaseOut2,
          "--n-box-shadow": boxShadow,
          "--n-color": color,
          "--n-text-color": textColor
        };
      });
      const themeClassHandle = inlineThemeDisabled ? useThemeClass("theme-class", void 0, cssVarsRef, props) : void 0;
      return {
        mergedClsPrefix: mergedClsPrefixRef,
        namespace: namespaceRef,
        isMounted: isMountedRef,
        containerRef,
        presetProps: vue.computed(() => {
          const pickedProps = keep(props, presetPropsKeys);
          return pickedProps;
        }),
        handleEsc,
        handleAfterLeave,
        handleClickoutside,
        handleBeforeLeave,
        doUpdateShow,
        handleNegativeClick,
        handlePositiveClick,
        handleCloseClick,
        cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
        themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
        onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender
      };
    },
    render() {
      const {
        mergedClsPrefix
      } = this;
      return vue.h(LazyTeleport, {
        to: this.to,
        show: this.show
      }, {
        default: () => {
          var _a;
          (_a = this.onRender) === null || _a === void 0 ? void 0 : _a.call(this);
          const {
            unstableShowMask
          } = this;
          return vue.withDirectives(vue.h("div", {
            role: "none",
            ref: "containerRef",
            class: [`${mergedClsPrefix}-modal-container`, this.themeClass, this.namespace],
            style: this.cssVars
          }, vue.h(NModalBodyWrapper, Object.assign({
            style: this.overlayStyle
          }, this.$attrs, {
            ref: "bodyWrapper",
            displayDirective: this.displayDirective,
            show: this.show,
            preset: this.preset,
            autoFocus: this.autoFocus,
            trapFocus: this.trapFocus,
            blockScroll: this.blockScroll
          }, this.presetProps, {
            onEsc: this.handleEsc,
            onClose: this.handleCloseClick,
            onNegativeClick: this.handleNegativeClick,
            onPositiveClick: this.handlePositiveClick,
            onBeforeLeave: this.handleBeforeLeave,
            onAfterEnter: this.onAfterEnter,
            onAfterLeave: this.handleAfterLeave,
            onClickoutside: unstableShowMask ? void 0 : this.handleClickoutside,
            renderMask: unstableShowMask ? () => {
              var _a2;
              return vue.h(vue.Transition, {
                name: "fade-in-transition",
                key: "mask",
                appear: (_a2 = this.internalAppear) !== null && _a2 !== void 0 ? _a2 : this.isMounted
              }, {
                default: () => {
                  return this.show ? vue.h("div", {
                    "aria-hidden": true,
                    ref: "containerRef",
                    class: `${mergedClsPrefix}-modal-mask`,
                    onClick: this.handleClickoutside
                  }) : null;
                }
              });
            } : void 0
          }), this.$slots)), [[zindexable$1, {
            zIndex: this.zIndex,
            enabled: this.show
          }]]);
        }
      });
    }
  });
  const commonVars$1 = {
    gapSmall: "4px 8px",
    gapMedium: "8px 12px",
    gapLarge: "12px 16px"
  };
  const self$2 = () => {
    return commonVars$1;
  };
  const flexLight = {
    name: "Flex",
    self: self$2
  };
  const flexLight$1 = flexLight;
  const flexProps = Object.assign(Object.assign({}, useTheme.props), {
    align: String,
    justify: {
      type: String,
      default: "start"
    },
    inline: Boolean,
    vertical: Boolean,
    reverse: Boolean,
    size: {
      type: [String, Number, Array],
      default: "medium"
    },
    wrap: {
      type: Boolean,
      default: true
    }
  });
  const NFlex = vue.defineComponent({
    name: "Flex",
    props: flexProps,
    setup(props) {
      const {
        mergedClsPrefixRef,
        mergedRtlRef
      } = useConfig(props);
      const themeRef = useTheme("Flex", "-flex", void 0, flexLight$1, props, mergedClsPrefixRef);
      const rtlEnabledRef = useRtl("Flex", mergedRtlRef, mergedClsPrefixRef);
      return {
        rtlEnabled: rtlEnabledRef,
        mergedClsPrefix: mergedClsPrefixRef,
        margin: vue.computed(() => {
          const {
            size: size2
          } = props;
          if (Array.isArray(size2)) {
            return {
              horizontal: size2[0],
              vertical: size2[1]
            };
          }
          if (typeof size2 === "number") {
            return {
              horizontal: size2,
              vertical: size2
            };
          }
          const {
            self: {
              [createKey("gap", size2)]: gap
            }
          } = themeRef.value;
          const {
            row,
            col
          } = getGap(gap);
          return {
            horizontal: depx(col),
            vertical: depx(row)
          };
        })
      };
    },
    render() {
      const {
        vertical,
        reverse,
        align,
        inline,
        justify,
        margin,
        wrap: wrap2,
        mergedClsPrefix,
        rtlEnabled
      } = this;
      const children = flatten(getSlot$1(this), false);
      if (!children.length)
        return null;
      return vue.h("div", {
        role: "none",
        class: [`${mergedClsPrefix}-flex`, rtlEnabled && `${mergedClsPrefix}-flex--rtl`],
        style: {
          display: inline ? "inline-flex" : "flex",
          flexDirection: (() => {
            if (vertical && !reverse)
              return "column";
            if (vertical && reverse)
              return "column-reverse";
            if (!vertical && reverse)
              return "row-reverse";
            else
              return "row";
          })(),
          justifyContent: justify,
          flexWrap: !wrap2 || vertical ? "nowrap" : "wrap",
          alignItems: align,
          gap: `${margin.vertical}px ${margin.horizontal}px`
        }
      }, children);
    }
  });
  const defaultSpan$1 = 1;
  const gridInjectionKey = createInjectionKey("n-grid");
  const defaultSpan = 1;
  const gridItemProps = {
    span: {
      type: [Number, String],
      default: defaultSpan
    },
    offset: {
      type: [Number, String],
      default: 0
    },
    suffix: Boolean,
    // private props
    privateOffset: Number,
    privateSpan: Number,
    privateColStart: Number,
    privateShow: {
      type: Boolean,
      default: true
    }
  };
  const NGridItem = vue.defineComponent({
    __GRID_ITEM__: true,
    name: "GridItem",
    alias: ["Gi"],
    props: gridItemProps,
    setup() {
      const {
        isSsrRef,
        xGapRef,
        itemStyleRef,
        overflowRef,
        layoutShiftDisabledRef
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      } = vue.inject(gridInjectionKey);
      const self2 = vue.getCurrentInstance();
      return {
        overflow: overflowRef,
        itemStyle: itemStyleRef,
        layoutShiftDisabled: layoutShiftDisabledRef,
        mergedXGap: vue.computed(() => {
          return pxfy(xGapRef.value || 0);
        }),
        deriveStyle: () => {
          void isSsrRef.value;
          const {
            privateSpan = defaultSpan,
            privateShow = true,
            privateColStart = void 0,
            privateOffset = 0
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          } = self2.vnode.props;
          const {
            value: xGap
          } = xGapRef;
          const mergedXGap = pxfy(xGap || 0);
          return {
            display: !privateShow ? "none" : "",
            gridColumn: `${privateColStart !== null && privateColStart !== void 0 ? privateColStart : `span ${privateSpan}`} / span ${privateSpan}`,
            marginLeft: privateOffset ? `calc((100% - (${privateSpan} - 1) * ${mergedXGap}) / ${privateSpan} * ${privateOffset} + ${mergedXGap} * ${privateOffset})` : ""
          };
        }
      };
    },
    render() {
      var _a, _b;
      if (this.layoutShiftDisabled) {
        const {
          span,
          offset,
          mergedXGap
        } = this;
        return vue.h("div", {
          style: {
            gridColumn: `span ${span} / span ${span}`,
            marginLeft: offset ? `calc((100% - (${span} - 1) * ${mergedXGap}) / ${span} * ${offset} + ${mergedXGap} * ${offset})` : ""
          }
        }, this.$slots);
      }
      return vue.h("div", {
        style: [this.itemStyle, this.deriveStyle()]
      }, (_b = (_a = this.$slots).default) === null || _b === void 0 ? void 0 : _b.call(_a, {
        overflow: this.overflow
      }));
    }
  });
  const commonVars = {
    headerFontSize1: "30px",
    headerFontSize2: "22px",
    headerFontSize3: "18px",
    headerFontSize4: "16px",
    headerFontSize5: "16px",
    headerFontSize6: "16px",
    headerMargin1: "28px 0 20px 0",
    headerMargin2: "28px 0 20px 0",
    headerMargin3: "28px 0 20px 0",
    headerMargin4: "28px 0 18px 0",
    headerMargin5: "28px 0 18px 0",
    headerMargin6: "28px 0 18px 0",
    headerPrefixWidth1: "16px",
    headerPrefixWidth2: "16px",
    headerPrefixWidth3: "12px",
    headerPrefixWidth4: "12px",
    headerPrefixWidth5: "12px",
    headerPrefixWidth6: "12px",
    headerBarWidth1: "4px",
    headerBarWidth2: "4px",
    headerBarWidth3: "3px",
    headerBarWidth4: "3px",
    headerBarWidth5: "3px",
    headerBarWidth6: "3px",
    pMargin: "16px 0 16px 0",
    liMargin: ".25em 0 0 0",
    olPadding: "0 0 0 2em",
    ulPadding: "0 0 0 2em"
  };
  const self$1 = (vars) => {
    const {
      primaryColor,
      textColor2,
      borderColor,
      lineHeight: lineHeight2,
      fontSize: fontSize2,
      borderRadiusSmall,
      dividerColor,
      fontWeightStrong,
      textColor1,
      textColor3,
      infoColor,
      warningColor,
      errorColor,
      successColor,
      codeColor
    } = vars;
    return Object.assign(Object.assign({}, commonVars), {
      aTextColor: primaryColor,
      blockquoteTextColor: textColor2,
      blockquotePrefixColor: borderColor,
      blockquoteLineHeight: lineHeight2,
      blockquoteFontSize: fontSize2,
      codeBorderRadius: borderRadiusSmall,
      liTextColor: textColor2,
      liLineHeight: lineHeight2,
      liFontSize: fontSize2,
      hrColor: dividerColor,
      headerFontWeight: fontWeightStrong,
      headerTextColor: textColor1,
      pTextColor: textColor2,
      pTextColor1Depth: textColor1,
      pTextColor2Depth: textColor2,
      pTextColor3Depth: textColor3,
      pLineHeight: lineHeight2,
      pFontSize: fontSize2,
      headerBarColor: primaryColor,
      headerBarColorPrimary: primaryColor,
      headerBarColorInfo: infoColor,
      headerBarColorError: errorColor,
      headerBarColorWarning: warningColor,
      headerBarColorSuccess: successColor,
      textColor: textColor2,
      textColor1Depth: textColor1,
      textColor2Depth: textColor2,
      textColor3Depth: textColor3,
      textColorPrimary: primaryColor,
      textColorInfo: infoColor,
      textColorSuccess: successColor,
      textColorWarning: warningColor,
      textColorError: errorColor,
      codeTextColor: textColor2,
      codeColor,
      codeBorder: "1px solid #0000"
    });
  };
  const typographyLight = {
    name: "Typography",
    common: commonLight,
    self: self$1
  };
  const typographyLight$1 = typographyLight;
  const defaultBreakpoints = {
    xs: 0,
    // mobile
    s: 640,
    // tablet
    m: 1024,
    // laptop s
    l: 1280,
    // laptop
    xl: 1536,
    // laptop l
    xxl: 1920
    // normal desktop display
  };
  const defaultCols = 24;
  const SSR_ATTR_NAME = "__ssr__";
  const gridProps = {
    layoutShiftDisabled: Boolean,
    responsive: {
      type: [String, Boolean],
      default: "self"
    },
    cols: {
      type: [Number, String],
      default: defaultCols
    },
    itemResponsive: Boolean,
    collapsed: Boolean,
    // may create grid rows < collapsedRows since a item may take all the row
    collapsedRows: {
      type: Number,
      default: 1
    },
    itemStyle: [Object, String],
    xGap: {
      type: [Number, String],
      default: 0
    },
    yGap: {
      type: [Number, String],
      default: 0
    }
  };
  const NGrid = vue.defineComponent({
    name: "Grid",
    inheritAttrs: false,
    props: gridProps,
    setup(props) {
      const {
        mergedClsPrefixRef,
        mergedBreakpointsRef
      } = useConfig(props);
      const numRegex = /^\d+$/;
      const widthRef = vue.ref(void 0);
      const breakpointsRef = useBreakpoints((mergedBreakpointsRef === null || mergedBreakpointsRef === void 0 ? void 0 : mergedBreakpointsRef.value) || defaultBreakpoints);
      const isResponsiveRef = useMemo(() => {
        if (props.itemResponsive)
          return true;
        if (!numRegex.test(props.cols.toString()))
          return true;
        if (!numRegex.test(props.xGap.toString()))
          return true;
        if (!numRegex.test(props.yGap.toString()))
          return true;
        return false;
      });
      const responsiveQueryRef = vue.computed(() => {
        if (!isResponsiveRef.value)
          return void 0;
        return props.responsive === "self" ? widthRef.value : breakpointsRef.value;
      });
      const responsiveColsRef = useMemo(() => {
        var _a;
        return (_a = Number(parseResponsivePropValue(props.cols.toString(), responsiveQueryRef.value))) !== null && _a !== void 0 ? _a : defaultCols;
      });
      const responsiveXGapRef = useMemo(() => parseResponsivePropValue(props.xGap.toString(), responsiveQueryRef.value));
      const responsiveYGapRef = useMemo(() => parseResponsivePropValue(props.yGap.toString(), responsiveQueryRef.value));
      const handleResize = (entry) => {
        widthRef.value = entry.contentRect.width;
      };
      const handleResizeRaf = (entry) => {
        beforeNextFrameOnce(handleResize, entry);
      };
      const overflowRef = vue.ref(false);
      const handleResizeRef = vue.computed(() => {
        if (props.responsive === "self") {
          return handleResizeRaf;
        }
        return void 0;
      });
      const isSsrRef = vue.ref(false);
      const contentElRef = vue.ref();
      vue.onMounted(() => {
        const {
          value: contentEl
        } = contentElRef;
        if (contentEl) {
          if (contentEl.hasAttribute(SSR_ATTR_NAME)) {
            contentEl.removeAttribute(SSR_ATTR_NAME);
            isSsrRef.value = true;
          }
        }
      });
      vue.provide(gridInjectionKey, {
        layoutShiftDisabledRef: vue.toRef(props, "layoutShiftDisabled"),
        isSsrRef,
        itemStyleRef: vue.toRef(props, "itemStyle"),
        xGapRef: responsiveXGapRef,
        overflowRef
      });
      return {
        isSsr: !isBrowser$2,
        contentEl: contentElRef,
        mergedClsPrefix: mergedClsPrefixRef,
        style: vue.computed(() => {
          if (props.layoutShiftDisabled) {
            return {
              width: "100%",
              display: "grid",
              gridTemplateColumns: `repeat(${props.cols}, minmax(0, 1fr))`,
              columnGap: pxfy(props.xGap),
              rowGap: pxfy(props.yGap)
            };
          }
          return {
            width: "100%",
            display: "grid",
            gridTemplateColumns: `repeat(${responsiveColsRef.value}, minmax(0, 1fr))`,
            columnGap: pxfy(responsiveXGapRef.value),
            rowGap: pxfy(responsiveYGapRef.value)
          };
        }),
        isResponsive: isResponsiveRef,
        responsiveQuery: responsiveQueryRef,
        responsiveCols: responsiveColsRef,
        handleResize: handleResizeRef,
        overflow: overflowRef
      };
    },
    render() {
      if (this.layoutShiftDisabled) {
        return vue.h("div", vue.mergeProps({
          ref: "contentEl",
          class: `${this.mergedClsPrefix}-grid`,
          style: this.style
        }, this.$attrs), this.$slots);
      }
      const renderContent = () => {
        var _a, _b, _c, _d, _e, _f, _g;
        this.overflow = false;
        const rawChildren = flatten(getSlot$1(this));
        const childrenAndRawSpan = [];
        const {
          collapsed,
          collapsedRows,
          responsiveCols,
          responsiveQuery
        } = this;
        rawChildren.forEach((child) => {
          var _a2, _b2, _c2, _d2, _e2;
          if (((_a2 = child === null || child === void 0 ? void 0 : child.type) === null || _a2 === void 0 ? void 0 : _a2.__GRID_ITEM__) !== true)
            return;
          if (isNodeVShowFalse(child)) {
            const clonedNode = vue.cloneVNode(child);
            if (clonedNode.props) {
              clonedNode.props.privateShow = false;
            } else {
              clonedNode.props = {
                privateShow: false
              };
            }
            childrenAndRawSpan.push({
              child: clonedNode,
              rawChildSpan: 0
            });
            return;
          }
          child.dirs = ((_b2 = child.dirs) === null || _b2 === void 0 ? void 0 : _b2.filter(({
            dir
          }) => dir !== vue.vShow)) || null;
          if (((_c2 = child.dirs) === null || _c2 === void 0 ? void 0 : _c2.length) === 0) {
            child.dirs = null;
          }
          const clonedChild = vue.cloneVNode(child);
          const rawChildSpan = Number((_e2 = parseResponsivePropValue((_d2 = clonedChild.props) === null || _d2 === void 0 ? void 0 : _d2.span, responsiveQuery)) !== null && _e2 !== void 0 ? _e2 : defaultSpan$1);
          if (rawChildSpan === 0)
            return;
          childrenAndRawSpan.push({
            child: clonedChild,
            rawChildSpan
          });
        });
        let suffixSpan = 0;
        const maybeSuffixNode = (_a = childrenAndRawSpan[childrenAndRawSpan.length - 1]) === null || _a === void 0 ? void 0 : _a.child;
        if (maybeSuffixNode === null || maybeSuffixNode === void 0 ? void 0 : maybeSuffixNode.props) {
          const suffixPropValue = (_b = maybeSuffixNode.props) === null || _b === void 0 ? void 0 : _b.suffix;
          if (suffixPropValue !== void 0 && suffixPropValue !== false) {
            suffixSpan = Number((_d = parseResponsivePropValue((_c = maybeSuffixNode.props) === null || _c === void 0 ? void 0 : _c.span, responsiveQuery)) !== null && _d !== void 0 ? _d : defaultSpan$1);
            maybeSuffixNode.props.privateSpan = suffixSpan;
            maybeSuffixNode.props.privateColStart = responsiveCols + 1 - suffixSpan;
            maybeSuffixNode.props.privateShow = (_e = maybeSuffixNode.props.privateShow) !== null && _e !== void 0 ? _e : true;
          }
        }
        let spanCounter = 0;
        let done = false;
        for (const {
          child,
          rawChildSpan
        } of childrenAndRawSpan) {
          if (done) {
            this.overflow = true;
          }
          if (!done) {
            const childOffset = Number((_g = parseResponsivePropValue((_f = child.props) === null || _f === void 0 ? void 0 : _f.offset, responsiveQuery)) !== null && _g !== void 0 ? _g : 0);
            const childSpan = Math.min(rawChildSpan + childOffset, responsiveCols);
            if (!child.props) {
              child.props = {
                privateSpan: childSpan,
                privateOffset: childOffset
              };
            } else {
              child.props.privateSpan = childSpan;
              child.props.privateOffset = childOffset;
            }
            if (collapsed) {
              const remainder = spanCounter % responsiveCols;
              if (childSpan + remainder > responsiveCols) {
                spanCounter += responsiveCols - remainder;
              }
              if (childSpan + spanCounter + suffixSpan > collapsedRows * responsiveCols) {
                done = true;
              } else {
                spanCounter += childSpan;
              }
            }
          }
          if (done) {
            if (child.props) {
              if (child.props.privateShow !== true) {
                child.props.privateShow = false;
              }
            } else {
              child.props = {
                privateShow: false
              };
            }
          }
        }
        return vue.h("div", vue.mergeProps({
          ref: "contentEl",
          class: `${this.mergedClsPrefix}-grid`,
          style: this.style,
          [SSR_ATTR_NAME]: this.isSsr || void 0
        }, this.$attrs), childrenAndRawSpan.map(({
          child
        }) => child));
      };
      return this.isResponsive && this.responsive === "self" ? vue.h(VResizeObserver, {
        onResize: this.handleResize
      }, {
        default: renderContent
      }) : renderContent();
    }
  });
  const style$1 = cB("a", `
 cursor: pointer;
 transition:
 color .3s var(--n-bezier),
 text-decoration-color .3s var(--n-bezier);
 text-decoration-color: var(--n-text-color);
 color: var(--n-text-color);
`);
  const aProps = Object.assign({}, useTheme.props);
  const NA = vue.defineComponent({
    name: "A",
    props: aProps,
    setup(props) {
      const {
        mergedClsPrefixRef,
        inlineThemeDisabled
      } = useConfig(props);
      const themeRef = useTheme("Typography", "-a", style$1, typographyLight$1, props, mergedClsPrefixRef);
      const cssVarsRef = vue.computed(() => {
        const {
          common: {
            cubicBezierEaseInOut: cubicBezierEaseInOut2
          },
          self: {
            aTextColor
          }
        } = themeRef.value;
        return {
          "--n-text-color": aTextColor,
          "--n-bezier": cubicBezierEaseInOut2
        };
      });
      const themeClassHandle = inlineThemeDisabled ? useThemeClass("a", void 0, cssVarsRef, props) : void 0;
      return {
        mergedClsPrefix: mergedClsPrefixRef,
        cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
        themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
        onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender
      };
    },
    render() {
      var _a;
      (_a = this.onRender) === null || _a === void 0 ? void 0 : _a.call(this);
      return vue.h("a", {
        class: [`${this.mergedClsPrefix}-a`, this.themeClass],
        style: this.cssVars
      }, this.$slots);
    }
  });
  const style = cB("text", `
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
`, [cM("strong", `
 font-weight: var(--n-font-weight-strong);
 `), cM("italic", {
    fontStyle: "italic"
  }), cM("underline", {
    textDecoration: "underline"
  }), cM("code", `
 line-height: 1.4;
 display: inline-block;
 font-family: var(--n-font-famliy-mono);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 box-sizing: border-box;
 padding: .05em .35em 0 .35em;
 border-radius: var(--n-code-border-radius);
 font-size: .9em;
 color: var(--n-code-text-color);
 background-color: var(--n-code-color);
 border: var(--n-code-border);
 `)]);
  const textProps = Object.assign(Object.assign({}, useTheme.props), {
    code: Boolean,
    type: {
      type: String,
      default: "default"
    },
    delete: Boolean,
    strong: Boolean,
    italic: Boolean,
    underline: Boolean,
    depth: [String, Number],
    tag: String,
    // deprecated
    as: {
      type: String,
      validator: () => {
        if (process.env.NODE_ENV !== "production") {
          warn$2("text", "`as` is deprecated, please use `tag` instead.");
        }
        return true;
      },
      default: void 0
    }
  });
  const NText = vue.defineComponent({
    name: "Text",
    props: textProps,
    setup(props) {
      const {
        mergedClsPrefixRef,
        inlineThemeDisabled
      } = useConfig(props);
      const themeRef = useTheme("Typography", "-text", style, typographyLight$1, props, mergedClsPrefixRef);
      const cssVarsRef = vue.computed(() => {
        const {
          depth,
          type: type2
        } = props;
        const textColorKey = type2 === "default" ? depth === void 0 ? "textColor" : `textColor${depth}Depth` : createKey("textColor", type2);
        const {
          common: {
            fontWeightStrong,
            fontFamilyMono,
            cubicBezierEaseInOut: cubicBezierEaseInOut2
          },
          self: {
            codeTextColor,
            codeBorderRadius,
            codeColor,
            codeBorder,
            [textColorKey]: textColor
          }
        } = themeRef.value;
        return {
          "--n-bezier": cubicBezierEaseInOut2,
          "--n-text-color": textColor,
          "--n-font-weight-strong": fontWeightStrong,
          "--n-font-famliy-mono": fontFamilyMono,
          "--n-code-border-radius": codeBorderRadius,
          "--n-code-text-color": codeTextColor,
          "--n-code-color": codeColor,
          "--n-code-border": codeBorder
        };
      });
      const themeClassHandle = inlineThemeDisabled ? useThemeClass("text", vue.computed(() => `${props.type[0]}${props.depth || ""}`), cssVarsRef, props) : void 0;
      return {
        mergedClsPrefix: mergedClsPrefixRef,
        compitableTag: useCompitable(props, ["as", "tag"]),
        cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
        themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
        onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender
      };
    },
    render() {
      var _a, _b, _c;
      const {
        mergedClsPrefix
      } = this;
      (_a = this.onRender) === null || _a === void 0 ? void 0 : _a.call(this);
      const textClass = [`${mergedClsPrefix}-text`, this.themeClass, {
        [`${mergedClsPrefix}-text--code`]: this.code,
        [`${mergedClsPrefix}-text--delete`]: this.delete,
        [`${mergedClsPrefix}-text--strong`]: this.strong,
        [`${mergedClsPrefix}-text--italic`]: this.italic,
        [`${mergedClsPrefix}-text--underline`]: this.underline
      }];
      const children = (_c = (_b = this.$slots).default) === null || _c === void 0 ? void 0 : _c.call(_b);
      return this.code ? vue.h("code", {
        class: textClass,
        style: this.cssVars
      }, this.delete ? vue.h("del", null, children) : children) : this.delete ? vue.h("del", {
        class: textClass,
        style: this.cssVars
      }, children) : vue.h(this.compitableTag || "span", {
        class: textClass,
        style: this.cssVars
      }, children);
    }
  });
  const _hoisted_1 = {
    key: 0,
    style: { "text-overflow": "ellipsis", "overflow": "hidden" }
  };
  const _hoisted_2 = { key: 1 };
  const _hoisted_3 = ["src", "alt"];
  const _sfc_main = /* @__PURE__ */ vue.defineComponent({
    __name: "nConnectButton",
    setup(__props) {
      const showModal = vue.ref(false);
      const { isConnected, address, connect, disconnect, wallets: wallets2 } = useWalletState();
      const { domain } = useWalletQuery();
      const toggleModal = () => {
        showModal.value = !showModal.value;
      };
      const mouseIn = vue.ref(false);
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createVNode(vue.unref(NButton), vue.mergeProps(_ctx.$attrs, {
            onMouseenter: _cache[0] || (_cache[0] = ($event) => mouseIn.value = true),
            onMouseleave: _cache[1] || (_cache[1] = ($event) => mouseIn.value = false),
            onClick: _cache[2] || (_cache[2] = ($event) => vue.unref(isConnected) ? vue.unref(disconnect)() : toggleModal()),
            style: { "width": "128px" }
          }), {
            default: vue.withCtx(() => [
              !mouseIn.value ? (vue.openBlock(), vue.createElementBlock("span", _hoisted_1, vue.toDisplayString(vue.unref(isConnected) ? vue.unref(domain) ? vue.unref(domain) : vue.unref(address) : "connect"), 1)) : (vue.openBlock(), vue.createElementBlock("span", _hoisted_2, vue.toDisplayString(vue.unref(isConnected) ? "disconnect" : "connect"), 1))
            ]),
            _: 1
          }, 16),
          vue.createVNode(vue.unref(NModal), {
            show: showModal.value,
            "onUpdate:show": _cache[3] || (_cache[3] = ($event) => showModal.value = $event),
            "transform-origin": "center",
            bordered: "",
            preset: "card",
            title: "Connect Wallet",
            style: { "min-width": "480px", "max-width": "860px", "width": "40vw" }
          }, {
            "header-extra": vue.withCtx(() => [
              vue.createVNode(vue.unref(NA), {
                href: "https://github.com/SuiFansCN/suiue",
                target: "blank"
              }, {
                default: vue.withCtx(() => [
                  vue.createTextVNode("Suiue by suifans")
                ]),
                _: 1
              })
            ]),
            default: vue.withCtx(() => [
              vue.createVNode(vue.unref(NGrid), {
                cols: 3,
                "x-gap": 24,
                "y-gap": 24
              }, {
                default: vue.withCtx(() => [
                  (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(wallets2), (wallet) => {
                    return vue.openBlock(), vue.createBlock(vue.unref(NGridItem), {
                      key: JSON.stringify(wallet.chains)
                    }, {
                      default: vue.withCtx(() => [
                        vue.createVNode(vue.unref(NButton), {
                          onClick: ($event) => vue.unref(connect)(wallet).then(toggleModal),
                          style: { "height": "114px", "width": "100%" }
                        }, {
                          default: vue.withCtx(() => [
                            vue.createVNode(vue.unref(NFlex), {
                              style: { "height": "100%", "width": "100%" },
                              vertical: "",
                              size: "large"
                            }, {
                              default: vue.withCtx(() => [
                                vue.createElementVNode("img", {
                                  style: { "width": "58px", "margin": "auto" },
                                  src: wallet.icon,
                                  alt: wallet.name
                                }, null, 8, _hoisted_3),
                                vue.createVNode(vue.unref(NText), null, {
                                  default: vue.withCtx(() => [
                                    vue.createTextVNode(vue.toDisplayString(wallet.name), 1)
                                  ]),
                                  _: 2
                                }, 1024)
                              ]),
                              _: 2
                            }, 1024)
                          ]),
                          _: 2
                        }, 1032, ["onClick"])
                      ]),
                      _: 2
                    }, 1024);
                  }), 128))
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["show"])
        ], 64);
      };
    }
  });
  exports2.FeatureNotSupportedError = FeatureNotSupportedError;
  exports2.InsufficientBalanceError = InsufficientBalanceError;
  exports2.NConnectButton = _sfc_main;
  exports2.PluginNotInstallError = PluginNotInstallError;
  exports2.ProviderAlreadyExistsError = ProviderAlreadyExistsError;
  exports2.ProviderNotExistsError = ProviderNotExistsError;
  exports2.RequestError = RequestError;
  exports2.SuiueProvider = _sfc_main$1;
  exports2.WalletAccountNotFoundError = WalletAccountNotFoundError;
  exports2.WalletNotConnectedError = WalletNotConnectedError;
  exports2.consts = consts;
  exports2.createSuiue = createSuiue;
  exports2.useWalletActions = useWalletActions;
  exports2.useWalletQuery = useWalletQuery;
  exports2.useWalletState = useWalletState;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
//# sourceMappingURL=suiue.umd.cjs.map
