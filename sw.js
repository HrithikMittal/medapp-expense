importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.2.0/workbox-sw.js');

if (workbox) {

  workbox.routing.registerRoute(
    // Cache image files.
    /\.(?:png|jpg|jpeg|svg|gif)$/,
    new workbox.strategies.StaleWhileRevalidate({
      // Use a custom cache name.
      cacheName: 'image-cache'
    })
  );

  workbox.routing.registerRoute(
    // Cache image files.
    /\.(?:css|js|json|html)$/,
    new workbox.strategies.StaleWhileRevalidate({
      // Use a custom cache name.
      cacheName: 'files-cache'
    })
  );

} else {
  console.log(`Boo! Workbox didn't load 😬`);
}
