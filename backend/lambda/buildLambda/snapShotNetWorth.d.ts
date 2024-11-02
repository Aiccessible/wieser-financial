import { Account, Holding, Security } from './API';
export declare const snapShotNetWorth: () => Promise<void>;
export declare const getAccountBalanceMultipler: (acc: Account) => 1 | -1;
export declare const reduceAccounts: (accs: Account[]) => number;
export declare const getNetWorth: (holdings: {
    security: Security | undefined;
    holding: Holding;
}[]) => number;
