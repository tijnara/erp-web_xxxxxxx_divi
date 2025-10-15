declare module "../../../../data/province.json" {
    interface Province {
        province_code: string;
        province_name: string;
    }
    const value: Province[];
    export default value;
}

