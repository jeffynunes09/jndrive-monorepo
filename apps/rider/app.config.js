const base = require('./app.json')

module.exports = {
  expo: {
    ...base.expo,
    plugins: [
      ...(base.expo.plugins ?? []),
      'expo-notifications',
    ],
    android: {
      ...base.expo.android,
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
  },
}
