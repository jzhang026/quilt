import querystring from 'querystring';

import {createMockContext} from '@shopify/jest-koa-mocks';

import createEnableCookiesRedirect from '../create-enable-cookies-redirect';
import createTopLevelRedirect from '../create-top-level-redirect';

const mockTopLevelRedirect = jest.fn();
jest.mock('../create-top-level-redirect', () =>
  jest.fn(() => mockTopLevelRedirect),
);

const query = querystring.stringify.bind(querystring);
const baseUrl = 'myapp.com/auth';
const shop = 'shop1.myshopify.io';
const path = '/auth/enable_cookies';
const apiKey = 'somekey';

describe('CreateEnableCookiesRedirect', () => {
  it('sets the test cookie', () => {
    const enableCookiesRedirect = createEnableCookiesRedirect(apiKey, path);
    const ctx = createMockContext({
      url: `https://${baseUrl}?${query({shop})}`,
    });

    enableCookiesRedirect(ctx);

    expect(ctx.cookies.set).toHaveBeenCalledWith('shopifyTestCookie', '1', {});
    expect(ctx.cookies.set).toBeCalledWith(
      'shopify.granted_storage_access',
      '1',
    );
  });

  it('sets up and calls the top level redirect', () => {
    const enableCookiesRedirect = createEnableCookiesRedirect(apiKey, path);
    const ctx = createMockContext({
      url: `https://${baseUrl}?${query({shop})}`,
    });

    enableCookiesRedirect(ctx);

    expect(createTopLevelRedirect).toHaveBeenCalledWith(apiKey, path);
    expect(mockTopLevelRedirect).toHaveBeenCalledWith(ctx);
  });
});
