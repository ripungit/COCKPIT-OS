export declare const COOKIE_NAMES: {
    readonly SESSION: "sid";
    readonly CSRF: "csrf_token";
};
export type CookieName = (typeof COOKIE_NAMES)[keyof typeof COOKIE_NAMES];
