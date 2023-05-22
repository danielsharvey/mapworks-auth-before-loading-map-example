import { SigninPopupArgs, SignoutRedirectArgs, User, UserManager } from "oidc-client-ts";
import { BehaviorSubject, Observable, of, switchMap } from "rxjs";
import { MapworksMap, MapworksStudioConfigOptions, MapworksUser, MapworksUserManager, MapworksUserManagerSettings } from "./mapworks.types";

declare let Studio: any;

const DEFAULT_MAPWORKS_API_ORIGIN = 'https://api.mapworks.io';

const DEFAULT_MAP_NAME = 'default';

export class MapworksMapService {

  ///
  public readonly DEFAULT_MAPWORKS_API_ORIGIN = DEFAULT_MAPWORKS_API_ORIGIN;

  private userSubj = new BehaviorSubject<MapworksUser | null>(null);
  private accessTokenSubj = new BehaviorSubject<string | undefined>(undefined);

  /**
   * A state Observable which emits the currently signed in user, or undefined
   * if no user is currently signed in.
   */
  public readonly user$ = this.userSubj.asObservable();

  /**
   * A state observable which emits the current (and valid) OAuth2 Access Token,
   * or undefined is not user is currently signed in.
   *
   * A new token is emitted when the token expires (before if the application
   * is active) and refreshed.
   */
  public readonly accessToken$ = this.accessTokenSubj.asObservable();

  private userManager?: MapworksUserManager;

  private userLoadedCb?: () => void;

  private maps: Record<string,MapworksMap> = {};

  /**
   * Returns a reference to the default map (named `default`).
   */
  get map(): MapworksMap {
    return this.maps[DEFAULT_MAP_NAME];
  }

  /**
   * Returns a reference to the requested map (`default` if not specified).
   */
  getMap(name = DEFAULT_MAP_NAME): MapworksMap {
    return this.maps[name];
  }

  /**
   * Construct an instance of MapworksMapService, optionally
   * providing Mapworks Organisation authentication/authorisation
   * settings.
   */
  constructor(
    private defaultLoginProvider?: MapworksUserManagerSettings,
    private apiOrigin = DEFAULT_MAPWORKS_API_ORIGIN) {}

  /**
   * Load Studio.
   * 
   * This loads the Mapworks Studio library code.
   */
  public async loadStudio(): Promise<void> {
    if (window.Studio) {
      return;
    }

    return new Promise((resolve, reject) => {
      let toLoad = 2;
      const onLoad = () => {
        toLoad--;
        return toLoad || resolve();
      };
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `${this.apiOrigin}/studio/latest/js/studio-core.js`;
      script.onload = onLoad;
      document.head.appendChild(script);
      const link = document.createElement('link');
      link.href = `${this.apiOrigin}/studio/latest/css/studio-core.css`;
      link.rel = 'stylesheet';
      link.onload = onLoad;
      document.head.appendChild(link);
    });
  }

  /**
   * Initialises (if not initialised) and returns the instance of
   * MapworksUserManager.
   * 
   * @throws {@link Error} if `defaultLoginProvider` not provided when constructing MapworksMapService
   */
  public async initUserManager(): Promise<MapworksUserManager> {
    return await this.getUserManager();
  }

  /**
   * Returns the instance of MapworksUserManager, initialising it
   * on-demand if required.
   * 
   * @throws {@link Error} if `defaultLoginProvider` not provided when constructing MapworksMapService
   */
  public async getUserManager(): Promise<MapworksUserManager> {
    await this.ensureUserManager();
    return this.userManager!;
  }

  /**
   * Returns the instance of the authorised MapworksUser, or `null` if
   * not currently authorised.
   */
  public async getUser(): Promise<MapworksUser | null> {
    return await this.ensureUserManager();
  }

  ///
  public async signinPopup(args?: SigninPopupArgs ) {
    if(this.map) {
      this.map.login(args);
    } else {
      (await this.getUserManager()).signinPopup(args);
    }
  }

  ///
  public async handleSigninCallback() {
    await this.loadStudio();
    Studio.OidcClient.signinCallback();
  }

  ///
  public async signoutRedirect(args?: SignoutRedirectArgs) {
    if (this.map) {
      this.map.logout(args);
    } else if (window.Studio) {
      (await this.getUserManager()).signoutRedirect(args);
    }
  }

  /**
   * Initialise a Mapworks Map component within the specific HTML component.
   * 
   * @param elementOrSelector a HTML element selection (string e.g. `#map`) or HTMLElement
   * @param config the Studio Map configuration
   * @param additionalConfig additional web interface configuration
   */
  public async initMap(
    elementOrSelector: string | Object,
    config: MapworksStudioConfigOptions,
    additionalConfig?: { [n: string]: any },
    name = DEFAULT_MAP_NAME,
  ): Promise<MapworksMap> {
    await this.loadStudio();
    const map = new Studio.init(elementOrSelector, config, additionalConfig);
    this.maps[name] = map;
    if(this.userManager) {
      map['_userManager'] = this.userManager;
    }
    map.on('session:change', async (u) => {
      // console.log('MAP session:change', u);
      this.userSubj.next(await this.getUser());
    });
    map.on('accessToken:change', (tokenType: string, accessToken: string) => {
      // console.log('MAP accessToken:change', tokenType, accessToken);
      this.accessTokenSubj.next(accessToken);
    });
    map.on('ready', () => {
      console.log('MAP ready');
    });
    return map;
  }

  /**
   * Ensures an instance of MapworksUserManager is available, initialising it
   * on-demand if required.
   * 
   * Returns the instance of the authorised MapworksUser, or `null` if
   * not currently authorised.
   * 
   * @throws {@link Error} if `defaultLoginProvider` not provided when constructing MapworksMapService
   */
  private async ensureUserManager(): Promise<MapworksUser | null> {
    if (!window.Studio) {
      await this.loadStudio();
    }

    // if we have a map, grab its user manager
    if (this.userManager === undefined) {
      const defaultMap = this.map;
      if(defaultMap) {
        const user = await defaultMap.getUser();
        const um = defaultMap['_userManager'];
        if(um) {
          this.userManager = um;
        }
      }
    }

    // otherwise, see if we can initialise our own
    if (this.userManager === undefined) {
      if(!this.defaultLoginProvider){
        throw new Error('No login provider');
      }
      this.userManager = new Studio.OidcClient.MapworksUserManager(
        this.defaultLoginProvider
      );
    }

    // attach an event listener for user changes
    if(this.userLoadedCb === undefined) {
      this.userLoadedCb = async () => {
        // console.log('USERMANAGER userLoaded');
        if (this.userManager) {
          const user = await this.userManager.init();
          this.userSubj.next(user);
          this.accessTokenSubj.next(user?.access_token);
        }
      };
      this.userManager!.events.addUserLoaded(this.userLoadedCb);
      const user = await this.userManager!.init();
      this.userSubj.next(user);
      this.accessTokenSubj.next(user?.access_token);
      return user;
    }

    return await this.userManager!.init();
  }
}
