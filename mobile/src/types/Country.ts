export interface ICountry {
    name: string;
    isoCode: string;
    // getAllCountries?(): ICountry[];
    // getCountryByCode?(): ICountry;
}
export interface IState {
    name: string;
    isoCode: string;
    countryCode: string;
    // getStatesOfCountry?(): IState[];
    // getStateByCodeAndCountry?(): IState;
    // getStateByCode?(): IState;
}
export interface ICity {
    name: string;
    countryCode: string;
    stateCode: string;
    // getAllCities?(): ICity[];
    // getCitiesOfState?(): ICity[];
    // getCitiesOfCountry?(): ICity[];
}
