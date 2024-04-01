/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ICountry, IState, ICity } from '../../../types/Country';

export function defaultKeyToCompare<T extends ICountry | IState | ICity>(entity: T) {
    return entity.name;
}

export const compare = <T extends ICountry | IState | ICity>(
    a: T,
    b: T,
    // eslint-disable-next-line no-unused-vars
    keyToCompare: (entity: T) => string = defaultKeyToCompare,
) => {
    if (keyToCompare(a) < keyToCompare(b)) return -1;
    if (keyToCompare(a) > keyToCompare(b)) return 1;
    return 0;
};

export const convertArrayToObject = (keys: string[], arr: string[][]): ICity[] => {
    const result = arr.map((subArr) => {
        return Object.fromEntries(keys.map((key, index) => [key, subArr[index]]))
    })

    return (result as unknown as ICity[]);
}