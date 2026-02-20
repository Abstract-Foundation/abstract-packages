/** @type {import('next').NextConfig} */
import { dirname, relative } from 'path';
import hash from 'string-hash';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const context = __dirname;

const nextConfig = {
  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg'),
    );

    // SVG Rules.
    //
    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Apply svgr to svgs and keep their IDs from clashing
      {
        test: /\.svg$/i,
        issuer: {
          and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
        },
        // fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: ({ resource }) => ({
          loader: '@svgr/webpack',
          options: {
            prettier: false,
            svgo: true,
            titleProp: true,
            svgoConfig: {
              plugins: [
                {
                  name: 'cleanupIds',
                  params: {
                    remove: true,
                    minify: true,
                  },
                },
                {
                  name: 'prefixIds',
                  params: {
                    delim: '-',
                    prefixClassNames: true,
                    prefixIds: true,
                    prefix: () => `svg${hash(relative(context, resource))}`,
                  },
                },
                // {
                //   name: 'preset-default',
                //   params: {
                //     overrides: { removeViewBox: false },
                //   },
                // },
              ],
            },
          },
        }),
      },
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

export default nextConfig;
