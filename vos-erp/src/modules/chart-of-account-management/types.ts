export type ChartOfAccount = {
  coa_id: number;
  gl_code: string;
  account_title: string;
  bsis_code: number;
  account_type: number;
  balance_type: number;
  description: string;
  memo_type: number;
  date_added: string;
  added_by: number;
  isPayment: {
    type: "Buffer";
    data: number[];
  };
  is_payment: null;
};

export type UpsertChartOfAccountDTO = Partial<Omit<ChartOfAccount, "coa_id">> & { account_title: string };

