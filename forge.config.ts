import type { ForgeConfig } from '@electron-forge/shared-types';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './src/assets/logo/patunay-256x256.png',
    osxSign: {},
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'Patunay-app',
        authors: '98Labs Inc.',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        authors: '98Labs Inc.',
      },
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        authors: '98Labs Inc.',
      },
    },
  ],
};

export default config;
