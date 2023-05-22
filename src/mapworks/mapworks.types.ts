import {
  SigninPopupArgs,
  User,
  UserManager,
  UserManagerSettings,
  UserProfile,
} from 'oidc-client-ts';

/**
 * An instance of a Mapworks map component.
 */
export declare class MapworksMap {
  /**
   * Return the Mapworks API Url.
   */
  public getServerUrl(): string;

  /**
   * Return the current OAuth2 Access Token.
   */
  public getAccessToken(): string;

  /**
   * Return the current OAuth2 Access Token type, usually `Bearer`.
   */
  public getTokenType(): string;

  /**
   * Returns the authorization scheme type and access token,
   * which may used as the value of the HTTP Authorization header.
   */
  public getAuthorization(): string;

  /**
   * Return the Mapworks API version.
   */
  public getApiVersion(): string;

  // XXX TODO
  [name: string]: any;
}

///
export interface MapworksStudioConfigOptions {
  mapworksPath: string;

  ///
  access?: MapworksAccess;

  /// The ID of the map to load.
  map?: string;

  /// The reference ID of the map to load. This will be ignored if a map ID is provided.
  mapRef?: string;

  /// XXX TODO
  [name: string]: any;

  ///
  mapworksLoginProvider?: MapworksUserManagerSettings;
}

export enum MapworksAccess {
  /** Start with Anonymous map access and do not provide option to sign in */
  Anonymous = 'anonymous-only',
  /** Start with Anonymous map access AND allow the option to sign in */
  AnonymousOrRegistered = 'anonymous-registered',
  /** Require users to sign in with a registered account only */
  RegisteredOnly = 'registered-only',
}

///
export interface MapworksUserManagerSettings extends UserManagerSettings {
  /**
   * Prefix used for keys in LocalStorage used to store OAuth2/OIDC authorisation state;
   * defaults to the OAuth2 Client ID.
   */
  storage_prefix?: string;

  /**
   * The user email representing the Mapworks Anonymous User (if enabled for the Mapworks Organisation);
   * this is usually `noreply@public-anonymous.mapworks.io`.
   */
  anonymousUser?: string;
}

/**
 * Mapworks user types.
 * @see https://krondor.amristar.com/bitbucket/projects/PPM/repos/mapworks-management-console/browse/src/app/api/models/system-user-type.ts#9
 * @see https://krondor.amristar.com/bitbucket/projects/PPM/repos/org-directory/browse/src/entity/types.ts
 */
export enum MapworksUserType {
  Org = 'org_user',
  Standalone = 'standalone_user',
}

/**
 * Mapworks user roles.
 * @see https://krondor.amristar.com/bitbucket/projects/PPM/repos/mapworks-management-console/browse/src/app/api/models/standalone-user-role.ts
 * @see https://krondor.amristar.com/bitbucket/projects/PPM/repos/mapworks-management-console/browse/src/app/api/models/org-user-role.ts
 * @see https://krondor.amristar.com/bitbucket/projects/PPM/repos/org-directory/browse/src/entity/types.ts
 */
export enum MapworksUserRole {
  AllUsers = 'all_users',
  Anonymous = 'anonymous',
  AppUser = 'app_user',
  FreeUser = 'free_user',
  MapDesigner = 'map_designer',
  MapDesignerIndividual = 'map_designer_individual',
  OrgAdmin = 'org_admin',
  OrgSubscriber = 'org_subscriber',
  SystemAdmin = 'system_admin',
}

export interface MapworksUserProfile extends UserProfile {
  /// Mapworks user ID
  'mapworks:id'?: string;

  /// Mapworks username (an email address)
  'mapworks:username'?: string;

  ///
  'mapworks:attributes'?: {
    [name: string]: any;
  };

  /// Mapworks user role
  'mapworks:role'?: MapworksUserRole;

  /// Mapworks user type
  'mapworks:type'?: MapworksUserType;

  /// Mapworks organisation ID (that the user belongs to)
  'mapworks:organisation'?: string;

  /// Mapworks organisation name (that the user belongs to)
  'mapworks:organisation_name'?: string;

  /// Default ACL for this user
  'mapworks:defaultAcl'?: {
    find?: Array<string>;
    read?: Array<string>;
    write?: Array<string>;
    remove?: Array<string>;
  };

  // XXX TODO Confirm
  // profile: "/latest/users/uibKziwgGA8p-vAj7BgwI",
}

export interface MapworksUser extends User {
  profile: MapworksUserProfile;
}

export declare class MapworksUserManager extends UserManager {
  ///
  constructor(settings?: MapworksUserManagerSettings);

  /**
   * Custom Mapworks method to initialise user auth session by checking if there is an
   * existing session in LocalStorage and performing a session renewal if required.
   */
  public init(): Promise<MapworksUser | null>;

  ///
  public getUserInfo(user: User): Promise<MapworksUserProfile>;

  ///
  public signinPopup(args?: SigninPopupArgs): Promise<MapworksUser>;

  ///
  public getProfile(user: User): Promise<MapworksUser>;
}

/**
 * Once Studio is loaded, the global reference `Studio` is defined.
 */
// export declare let Studio: any;

/**
 * Once Studio is loaded, the global reference `Studio` is defined.
 */
declare global {
  interface Window {
    // map: any;
    Studio: any;
  }
}
