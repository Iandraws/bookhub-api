interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties
}

export class Logger {
  private static formatMessage(level: string, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };
    
    return JSON.stringify(logEntry);
  }

  static info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('INFO', message, context));
  }

  static warn(message: string, context?: LogContext, error?: Error): void {
    console.warn(this.formatMessage('WARN', message, context, error));
  }

  static error(message: string, context?: LogContext, error?: Error): void {
    console.error(this.formatMessage('ERROR', message, context, error));
  }

  static debug(message: string, context?: LogContext): void {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }
}