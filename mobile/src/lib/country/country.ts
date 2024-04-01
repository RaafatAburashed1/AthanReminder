import countryJSON from './country.json';
import stateJSON from './states.json';
import cityList from './cities.json';
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

    const cityList = getAllCities();
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

let convertedCityList: ICity[] = [];
// Get a list of all cities.
function getAllCities(keys: string[] = KEYS): ICity[] {
    if (convertedCityList.length) {
        return convertedCityList;
    }

    const cityJSON: string[][] = cityList;
    convertedCityList = convertArrayToObject(keys ?? KEYS, cityJSON);
    return (convertedCityList as unknown as ICity[])
}


