declare module "../../../../data/city.json" {
    interface City {
        city_code: string;
        city_name: string;
        province_code: string;
    }
    const value: City[];
    export default value;
}

