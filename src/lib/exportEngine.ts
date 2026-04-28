// src/lib/exportEngine.ts
import ExcelJS from 'exceljs';
import type { RecordEntry } from './types';

export const ExportEngine = {
    async generateAreaExcel(areaCode: string, records: RecordEntry[]) {
        if (records.length === 0) return alert("No data to export.");

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('CenHoD Data');

        // Styling the Header Row
        sheet.addRow([
            "Line No.", "Building No.", "C. House No.", "Type", 
            "Remarks", "Household No.", "Head of Household", "Members", "Mobile No."
        ]).font = { bold: true };

        // Setting Column Widths
        sheet.columns = [
            { width: 10 }, { width: 15 }, { width: 15 }, { width: 10 },
            { width: 30 }, { width: 15 }, { width: 30 }, { width: 10 }, { width: 15 }
        ];

        // Injecting the Data
        records.forEach(r => {
            sheet.addRow([
                r.lineNo,
                r.buildingNo,
                r.cHouseNo,
                r.type,
                r.remarks || '-',
                r.householdNo || '-',
                r.headName || '-',
                r.members || '-',
                r.mobile || '-'
            ]);
        });

        // Generate the File Blob
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Trigger the Android/Chrome Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CenHoD_${areaCode}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};