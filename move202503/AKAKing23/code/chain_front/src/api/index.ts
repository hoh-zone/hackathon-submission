import service from './axios';
import cozeApi from './coze';

export { service };
export * from './coze';

export default {
  service,
  coze: cozeApi
}; 