declare module "jspdf" {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
        lastAutoTable: any;
    }
}
