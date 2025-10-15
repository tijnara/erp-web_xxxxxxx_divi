export type User = {
    user_id: number;
    user_email: string;
    user_password?: string;
    user_fname: string;
    user_mname?: string;
    user_lname: string;
    user_contact?: string;
    user_province?: string;
    user_city?: string;
    user_brgy?: string;
    user_department?: number;
    user_sss?: string;
    user_philhealth?: string;
    user_tin?: string;
    user_position?: string;
    user_dateOfHire?: string;
    user_bday?: string;
    user_image?: string;
    updateAt?: string;
    external_id?: string;
    is_deleted?: {
        type: "Buffer";
        data: number[];
    };
    update_at?: string;
    externalId?: string;
    isDeleted?: boolean;
    biometric_id?: string;
    rf_id?: string;
    isAdmin?: number;
    user_tags?: string[];
    role_id?: string;
};

export type UpsertUserDTO = Partial<Omit<User, "user_id">>;
