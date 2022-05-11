const consoleInfoMock = jest.spyOn(console, 'info').mockImplementation(() => {});
const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

import axios, { AxiosError } from 'axios';
import { build } from '../../index';
import { symbols } from 'pino';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
    consoleInfoMock.mockClear();
    consoleErrorMock.mockClear();
    mockedAxios.post.mockClear();
});

test('stream has metadata deactivated', async () => {
    const stream = build();
    stream[symbols.needsMetadataGsym] = false;

    stream.write('');
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(consoleInfoMock).not.toHaveBeenCalled();
    expect(consoleErrorMock).not.toHaveBeenCalled();
});

test('stream has not sematext config', async () => {
    const msg = JSON.stringify({ message: 'toto', value: 32 });

    const stream = build();
    stream.lastLevel = 30;

    stream.write(msg);
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(consoleInfoMock).toHaveBeenCalledWith(msg);
    expect(consoleErrorMock).not.toHaveBeenCalled();
});

test('sematext HTTP request fail - simple error', async () => {
    const baseURL = 'https://sematext.com';
    const index = 'abcd';
    const msg = JSON.stringify({ message: 'toto', value: 32 });

    const stream = build({ baseURL, index });
    stream.lastLevel = 30;

    mockedAxios.post.mockRejectedValueOnce(new Error('toto'));

    stream.write(msg);
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseURL}/${index}/mockConstructor`,
        msg,
        { headers: { 'Content-Type': 'application/json' } },
    );

    expect(consoleInfoMock).toHaveBeenCalledWith(msg);
    expect(consoleErrorMock).toHaveBeenCalledWith(JSON.stringify({
        level: 50,
        type: 'error-request-sematext',
        message: 'toto',
    }));
});

test('sematext HTTP request fail - axios error with response', async () => {
    const baseURL = 'https://sematext.com';
    const index = 'abcd';
    const msg = JSON.stringify({ message: 'toto', value: 32 });

    const stream = build({ baseURL, index });
    stream.lastLevel = 30;

    const error: AxiosError = {
        message: 'response error 500',
        name: 'error',
        isAxiosError: true,
        config: {},
        toJSON: () => ({}),
        response: {
            data: { message: 'test' },
            status: 500,
            statusText: 'internal error',
            headers: {},
            config: {},
        },
    };

    mockedAxios.post.mockRejectedValueOnce(error);

    stream.write(msg);
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseURL}/${index}/mockConstructor`,
        msg,
        { headers: { 'Content-Type': 'application/json' } },
    );

    expect(consoleInfoMock).toHaveBeenCalledWith(msg);
    expect(consoleErrorMock).toHaveBeenCalledWith(JSON.stringify({
        level: 50,
        type: 'error-request-sematext',
        message: 'response error 500',
        response_data: { message: 'test' },
        response_status: 500,
    }));
});

test('sematext HTTP request fail - axios error without response', async () => {
    const baseURL = 'https://sematext.com';
    const index = 'abcd';
    const msg = JSON.stringify({ message: 'toto', value: 32 });

    const stream = build({ baseURL, index });
    stream.lastLevel = 30;

    const error: AxiosError = {
        message: 'response error 500',
        name: 'error',
        isAxiosError: true,
        config: {},
        toJSON: () => ({}),
    };

    mockedAxios.post.mockRejectedValueOnce(error);

    stream.write(msg);
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseURL}/${index}/mockConstructor`,
        msg,
        { headers: { 'Content-Type': 'application/json' } },
    );

    expect(consoleInfoMock).toHaveBeenCalledWith(msg);
    expect(consoleErrorMock).toHaveBeenCalledWith(JSON.stringify({
        level: 50,
        type: 'error-request-sematext',
        message: 'response error 500',
    }));
});

test('sematext HTTP request success', async () => {
    const baseURL = 'https://sematext.com';
    const index = 'abcd';
    const msg = JSON.stringify({ message: 'toto', value: 32 });

    const stream = build({ baseURL, index });
    stream.lastLevel = 30;

    mockedAxios.post.mockResolvedValueOnce(Promise.resolve());

    stream.write(msg);
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseURL}/${index}/mockConstructor`,
        msg,
        { headers: { 'Content-Type': 'application/json' } },
    );

    expect(consoleInfoMock).toHaveBeenCalledWith(msg);
    expect(consoleErrorMock).not.toHaveBeenCalled();
});
