import { tap } from 'rxjs';
import { MapworksMapService, MapworksStudioConfigOptions } from './mapworks';
import './styles.css';

/*
 * this configuration needs to be updated if you are running locally or forked
 */

const mapworksOrgUrl = 'https://app.mapworks.io';
const client_id = '3mvor82v8k8f6nbi4f8bpihsom';
const mapRef = 'map-osm-public';

/*
 * this configuration should generally work but may be adapted for your use
 */

const appUrl = window.location.origin;

const width = 400;
const left = (screen.width - width) / 2;
const height = 550;
const top = (screen.height - height) / 2;

const scope = [
  'openid',
  'email',
  'profile',
  'https://apis.mapworks.io/auth/mapsengine.superadmin',
  'https://apis.mapworks.io/auth/mapsengine',
  'https://apis.mapworks.io/auth/mapsengine.readonly',
  'https://apis.mapworks.io/auth/org-management',
  'https://apis.mapworks.io/auth/org-management.groups',
  'https://apis.mapworks.io/auth/org-management.readonly',
  'https://apis.mapworks.io/auth/org-subscriber',
  'https://apis.mapworks.io/auth/org-management.accounts',
  'https://apis.mapworks.io/auth/org-management.accounts.readonly',
  'https://apis.mapworks.io/auth/org-management.invitations',
  'https://apis.mapworks.io/auth/individual-subscriber',
].join(' ');

const studioConfig: MapworksStudioConfigOptions = {
  mapworksPath: mapworksOrgUrl,
  mapRef,
  // access: MapworksAccess.Anonymous,

  navigationControl: false,
  timeControl: false,
  scaleControl: true,
  toolbarControl: true,
  zoomControl: false,

  mapworksLoginProvider: {
    authority: mapworksOrgUrl, // /.well-known/openid-configuration
    client_id,
    redirect_uri: appUrl + '/public/login-callback.html',
    silent_redirect_uri: appUrl + '/public/login-callback.html',
    popup_redirect_uri: appUrl + '/public/login-callback.html',
    post_logout_redirect_uri: appUrl,
    anonymousUser: 'noreply@public-anonymous.mapworks.io',
    popupWindowFeatures: {
      location: false,
      toolbar: false,
      width,
      height,
      left,
      top,
    },
    response_type: 'code',
    scope,
    prompt: 'select_account',
    automaticSilentRenew: true,
    loadUserInfo: true,
  },
};

console.info('Configured Mapworks Application:');
console.info('client_id', studioConfig.mapworksLoginProvider?.client_id);
console.info(
  'popup_redirect_uri',
  studioConfig.mapworksLoginProvider?.popup_redirect_uri
);
console.info(
  'post_logout_redirect_uri',
  studioConfig.mapworksLoginProvider?.post_logout_redirect_uri
);

/*
 * initialise the map service and lay out page
 */

const mapService = new MapworksMapService(studioConfig.mapworksLoginProvider);

// XXX TODO FIX ME
if(window.location.pathname === '/public/login-callback.html') {
  mapService.handleSigninCallback();
}

const urlParams = new URLSearchParams(window.location.search);
const showMapAuto = 'true' === urlParams.get('show-map-automatically');

function initMap() {
  mapService.initMap('#mapworks-map', studioConfig);
}

(async () => {
  // mapService.initUserManager();
  const user = await mapService.getUser();
  if(user && showMapAuto) {
    initMap();
  }
})();

const appDiv: HTMLElement = document.getElementById('app')!;

appDiv.innerHTML = `
  <div style="display: flex; flex-direction: column; height: 100%;">
    <h1>Mapworks Auth Example v1</h1>
    <p>
      User: <span id="user"></span>
      <br/>Access Token: <span id="access-token"></span>
    </p>
    <div>
      <button id="signin-button">Sign In</button>
      <button id="signout-button">Sign Out</button>
      <button id="show-map-button">Show Map</button>
      <input id="show-map-automatically" type="checkbox"> Show map automatically if signed in
    </div>
    <div class="map" id="mapworks-map" style="flex-grow: 1; margin-top: 6px; margin-bottom: 6px;"></div>
  </div>
`;

const userDiv: HTMLElement | null = document.getElementById('user');

mapService.user$
  .pipe(
    tap((u) => {
      if (userDiv) {
        userDiv.innerText = u
          ? `${u.profile?.given_name || u.profile?.preferred_username} ${
              u.profile?.family_name || ''
            }`
          : '<Not signed in>';
      }
      if(u && !mapService.map && showMapAuto) {
        initMap();
      }
    })
  )
  .subscribe();

const atDiv: HTMLElement | null = document.getElementById('access-token');
mapService.accessToken$
  .pipe(
    tap((accessToken) => {
      if(atDiv) {
        atDiv.innerText = accessToken ?? '-';
      }
    })
  )
  .subscribe();

const signinButton = document.getElementById('signin-button');
signinButton?.addEventListener('click', async () => {
  const user = await mapService.getUser();
  if(!user) {
    console.log('Signing in...');
    mapService.signinPopup();
  } else {
    console.log('Already signed in');
  }
});

const signoutButton = document.getElementById('signout-button');
signoutButton?.addEventListener('click', async () => {
  const user = await mapService.getUser();
  if(user) {
    console.log('Signing out...');
    mapService.signoutRedirect();
  } else {
    console.log('Not signed in');
  }
});

const showMapButton = document.getElementById('show-map-button');
showMapButton?.addEventListener('click', () => {
  if(!mapService.map) {
    console.log('Initialising the map...');
    initMap();
  } else {
    console.log('Map already shown');
  }
});

const showMapAutoCheckbox = document.getElementById('show-map-automatically');
console.log('-->', showMapAutoCheckbox);
if(showMapAutoCheckbox instanceof HTMLInputElement) {
  showMapAutoCheckbox.checked = showMapAuto;
  showMapAutoCheckbox.addEventListener('click', (e) => {
    if(showMapAutoCheckbox.checked) {
      urlParams.set('show-map-automatically', 'true');
    } else {
      urlParams.delete('show-map-automatically');
    }
    window.location.search = urlParams.toString();
  });
}
