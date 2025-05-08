/**
 * 日志管理工具类
 * 用于记录、显示和导出应用程序的日志
 */
interface LogEntry {
  timestamp: string;
  message: string;
  data?: any;
}

class LogManager {
  static logs: LogEntry[] = [];

  // 添加日志
  static addLog(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[LOG] ${message}`, data);
    this.logs.push({ timestamp, message, data });
  }

  // 清除日志
  static clearLogs() {
    this.logs = [];
  }

  // 下载日志
  static downloadLogs() {
    const logText = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hashcat-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default LogManager; 