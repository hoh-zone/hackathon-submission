import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import session from 'koa-session';
import router from './routes';

const app = new Koa();
const PORT = process.env.PORT || 3001;

// 配置session
app.keys = ['some secret hurr']; // cookie签名密钥，应该在实际项目中使用环境变量
const SESSION_CONFIG = {
  key: 'koa:sess', // cookie key
  maxAge: 86400000, // cookie的过期时间，毫秒，默认是1天
  autoCommit: true, // 自动提交到响应头
  overwrite: true, // 是否可以重写
  httpOnly: true, // 是否只有服务器端可以访问
  signed: true, // 签名
  rolling: false, // 每次响应时刷新过期时间
  renew: false, // 快过期时刷新
};

// 中间件
app.use(session(SESSION_CONFIG, app));
app.use(bodyParser());

// 路由
app.use(router.routes());
app.use(router.allowedMethods());

// 错误处理
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx);
});

app.listen(PORT, () => {
  console.log(`服务器已启动，监听端口 ${PORT}`);
});
