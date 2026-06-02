import { Platform } from 'react-native';

/** Firebase Web SDK + fetch için React Native polyfill'leri (release APK). */
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

const g = globalThis as typeof globalThis & { FormData?: typeof FormData };

if (typeof g.FormData === 'undefined') {
  g.FormData = require('react-native/Libraries/Network/FormData').default;
}
