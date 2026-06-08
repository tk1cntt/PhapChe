import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Provide a dynamic locale based on request, or default to 'vi'
  const locale = 'vi';
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
