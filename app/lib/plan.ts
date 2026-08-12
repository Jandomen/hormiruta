export function isPlanExpired(user: any): boolean {
    const expiry = user?.subscriptionExpiry;
    if (!expiry) return false;
    const t = new Date(expiry).getTime();
    return !isNaN(t) && t < Date.now();
}

export function isProUser(user: any): boolean {
    if (user?.adminGranted === true) return true;
    const isPaidPlan = user?.plan === 'premium' || user?.plan === 'fleet';
    const isActive = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';
    return isPaidPlan && isActive && !isPlanExpired(user);
}

export function isFleetActive(user: any): boolean {
    if (user?.adminGranted === true) return true;
    const isPaidPlan = user?.plan === 'fleet';
    const isActive = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';
    return isPaidPlan && isActive && !isPlanExpired(user);
}
