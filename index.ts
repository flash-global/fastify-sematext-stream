import { FastifyLoggerStreamDestination } from 'fastify/types/logger';
import { symbols } from 'pino';
import axios from 'axios';

type LogLevel = 10 | 20 | 30 | 40 | 50 | 60;

const loggers = {
    10: console.trace,
    20: console.debug,
    30: console.info,
    40: console.warn,
    50: console.error,
    60: console.error,
};

const DEFAULT_LOG_LEVEL = 30;

type StreamConfig = {
    baseURL: string,
    index: string,
};

type StreamState = {
    [symbols.needsMetadataGsym]: boolean,
    lastLevel: LogLevel,
    config: StreamConfig | null,
};

type Stream = FastifyLoggerStreamDestination & StreamState;

const sendToSematext = async (msg: string, logLevel: LogLevel, config: StreamConfig) => {
    const url = `${config.baseURL}/${config.index}/${loggers[logLevel].name}`;

    try {
        await axios.post(url, msg, { headers: { 'Content-Type': 'application/json' } });
    } catch (error: any) {
        const content: { [key: string]: any } = {
            level: 50,
            type: 'error-request-sematext',
            message: error?.message,
        };

        if (error?.isAxiosError) {
            content.response_data = error.response.data;
            content.response_status = error.response.status;
        }

        loggers[50](JSON.stringify(content));
    }
};

const stream: Stream = {
    [symbols.needsMetadataGsym]: true,
    lastLevel: DEFAULT_LOG_LEVEL,
    config: null,

    write(msg: string) {
        if (!this[symbols.needsMetadataGsym]) {
            return;
        }

        if (this.config !== null) {
            setImmediate(() => sendToSematext(msg, this.lastLevel, this.config as StreamConfig));
        }

        loggers[this.lastLevel](msg.trim());
    },
};

const build = (config: StreamConfig | null = null): Stream => Object.assign<Stream, StreamState>(
    stream,
    { config: config, [symbols.needsMetadataGsym]: true, lastLevel: DEFAULT_LOG_LEVEL },
);

export { StreamConfig, StreamState, Stream, LogLevel, build };
