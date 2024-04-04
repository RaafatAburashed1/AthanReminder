import countryJSON from './country.json';
import stateJSON from './states.json';
import cityRange1 from './cities/cityRange1.json';
import cityRange2 from './cities/cityRange2.json';
import cityRange3 from './cities/cityRange3.json';
import cityRange4 from './cities/cityRange4.json';
import type { ICity, ICountry, IState } from '../../types/Country';
import { compare, convertArrayToObject } from './util';

// Get a list of all countries.
export function getAllCountries(): ICountry[] {
    return countryJSON;
}

export function getStatesOfCountry(countryCode: string = ''): IState[] {
    if (!countryCode) return [];
    // get data from file or cache
    const states = stateJSON.filter((value) => {
        return value.countryCode === countryCode;
    });
    return states.sort(compare);
}

// Get a list of cities belonging to a specific state and country.
export function getCitiesOfState(countryCode: string, stateCode: string): ICity[] {
    if (!stateCode) return [];
    if (!countryCode) return [];

    const cityList = getAllCities(countryCode);
    const cities = (cityList as ICity[]).filter((value: { countryCode: string; stateCode: string }) => {
        return value.countryCode === countryCode && value.stateCode === stateCode;
    });

    return cities.sort(compare);
}

const KEYS = [
    "name",
    "countryCode",
    "stateCode",
]

// Get a list of all cities.
function getAllCities(countryCode: string): ICity[] {
    let convertedCityList: ICity[] = [];
    const keys: string[] = KEYS;
    let cityJSON: string[][];
    if (countryCode >= 'AD' && countryCode <= 'DO') {
        cityJSON = cityRange1;
    } else if (countryCode >= 'DZ' && countryCode <= 'LA') {
        cityJSON = cityRange2;
    } else if (countryCode >= 'LB' && countryCode <= 'RO') {
        cityJSON = cityRange3;
    } else {
        cityJSON = cityRange4;
    }

    // const cityJSON: string[][] = cityList;
    convertedCityList = convertArrayToObject(keys ?? KEYS, cityJSON);
    return (convertedCityList as unknown as ICity[])
}


