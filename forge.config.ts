import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './src/ui/assets/logo/patunay-logo.png',
    osxSign: {}
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        authors: '98Labs Inc.',
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        authors: '98Labs Inc.',
      }
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        authors: '98Labs Inc.',
      }
    },
    new MakerSquirrel({
        name: 'Patunay-app',
        authors: '98Labs Inc.',
      }, ['win32']),
  ]
};

export default config;