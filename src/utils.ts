import { FuelEntry, MonthlyReport, Car } from './types';
import { format, parseISO, isSameMonth, differenceInMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from './lib/supabase';
import { MaintenanceRecord } from './types';

export const calculateMonthlyReport = (entries: FuelEntry[], selectedDate: Date = new Date()): MonthlyReport => {
  const monthlyEntries = entries.filter(entry => 
    isSameMonth(parseISO(entry.date), selectedDate)
  );

  if (monthlyEntries.length === 0) {
    return {
      totalCost: 0,
      averageConsumption: 0,
      costPerKm: 0,
      totalKm: 0,
      averageFuelPrice: 0,
    };
  }

  const sortedEntries = [...monthlyEntries].sort((a, b) => 
    parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );

  const totalCost = sortedEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
  const totalLiters = sortedEntries.reduce((sum, entry) => sum + entry.liters, 0);
  const averageFuelPrice = totalLiters > 0 ? totalCost / totalLiters : 0;

  if (sortedEntries.length < 2) {
    return {
      totalCost,
      averageConsumption: 0,
      costPerKm: 0,
      totalKm: 0,
      averageFuelPrice,
    };
  }

  let totalKm = 0;
  let consumptionLiters = 0;

  for (let i = 1; i < sortedEntries.length; i++) {
    const kmDiff = sortedEntries[i].currentKm - sortedEntries[i-1].currentKm;
    totalKm += kmDiff;
    consumptionLiters += sortedEntries[i-1].liters;
  }

  return {
    totalCost,
    averageConsumption: totalKm / consumptionLiters,
    costPerKm: totalCost / totalKm,
    totalKm,
    averageFuelPrice,
  };
};

export const exportToCSV = (entries: FuelEntry[]): void => {
  const headers = ['Data', 'Quilometragem', 'Litros', 'Valor Total (R$)'];
  const rows = entries.map(entry => [
    format(parseISO(entry.date), 'dd/MM/yyyy'),
    entry.currentKm,
    entry.liters,
    entry.totalCost.toFixed(2),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'consumo-combustivel.csv';
  link.click();
};

export const exportToPDF = async (reportElement: HTMLElement, carModel: string, month: Date): Promise<void> => {
  try {
    const canvas = await html2canvas(reportElement, {
      scale: 2,
      backgroundColor: null,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
    });

    const imgWidth = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Adiciona título
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Relatório Mensal - ${carModel}`, 15, 15);
    pdf.setFontSize(12);
    pdf.text(`Período: ${format(month, 'MMMM yyyy', { locale: ptBR })}`, 15, 25);
    
    // Adiciona a imagem do relatório
    pdf.addImage(imgData, 'PNG', 15, 35, imgWidth, imgHeight);
    
    // Adiciona rodapé
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    const today = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    pdf.text(`Relatório gerado em: ${today}`, 15, pdf.internal.pageSize.height - 10);

    pdf.save(`relatorio-${carModel.toLowerCase()}-${format(month, 'MM-yyyy')}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
  }
};

export const exportBatchPDF = async (cars: Car[], entries: FuelEntry[], month: Date): Promise<void> => {
  try {
    if (cars.length === 0) {
      console.warn('Nenhum carro encontrado para gerar relatórios');
      return;
    }

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
    });

    const tempDiv = document.createElement('div');
    document.body.appendChild(tempDiv);
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '1024px';
    tempDiv.style.height = '600px';
    tempDiv.style.backgroundColor = '#1E293B';

    let firstPage = true;

    for (const car of cars) {
      const carEntries = entries.filter(entry => entry.carId === car.id);
      
      if (carEntries.length === 0) {
        console.warn(`Nenhuma entrada encontrada para o carro ${car.model}`);
        continue;
      }

      if (!firstPage) {
        pdf.addPage();
      }
      firstPage = false;

      const report = calculateMonthlyReport(carEntries, month);

      tempDiv.innerHTML = `
        <div style="
          background-color: #1E293B;
          padding: 30px;
          color: white;
          font-family: Arial;
          height: 100%;
          box-sizing: border-box;
        ">
          <div style="
            background: linear-gradient(135deg, #2563eb 0%, #4338ca 100%);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 25px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          ">
            <h1 style="
              color: white;
              font-size: 28px;
              margin: 0;
              font-weight: bold;
              text-transform: uppercase;
            ">Relatório Mensal - ${car.model}</h1>
            <p style="
              color: #93c5fd;
              font-size: 16px;
              margin: 8px 0 0 0;
            ">${format(month, 'MMMM yyyy', { locale: ptBR })} - Placa: ${car.licensePlate}</p>
          </div>
          
          <div style="
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 25px;
          ">
            <div style="
              background: rgba(255,255,255,0.1);
              padding: 20px;
              border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.2);
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            ">
              <div style="
                background: rgba(59, 130, 246, 0.2);
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;
                font-size: 20px;
              ">🚗</div>
              <h3 style="
                color: #93c5fd;
                margin: 0 0 8px 0;
                font-size: 14px;
                font-weight: normal;
              ">Média de Consumo</h3>
              <p style="
                color: white;
                font-size: 20px;
                margin: 0;
                font-weight: bold;
              ">${report.averageConsumption.toFixed(1)} km/l</p>
            </div>
            
            <div style="
              background: rgba(255,255,255,0.1);
              padding: 20px;
              border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.2);
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            ">
              <div style="
                background: rgba(139, 92, 246, 0.2);
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;
                font-size: 20px;
              ">💰</div>
              <h3 style="
                color: #93c5fd;
                margin: 0 0 8px 0;
                font-size: 14px;
                font-weight: normal;
              ">Total Gasto</h3>
              <p style="
                color: white;
                font-size: 20px;
                margin: 0;
                font-weight: bold;
              ">R$ ${report.totalCost.toFixed(2)}</p>
            </div>
            
            <div style="
              background: rgba(255,255,255,0.1);
              padding: 20px;
              border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.2);
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            ">
              <div style="
                background: rgba(99, 102, 241, 0.2);
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;
                font-size: 20px;
              ">⚡</div>
              <h3 style="
                color: #93c5fd;
                margin: 0 0 8px 0;
                font-size: 14px;
                font-weight: normal;
              ">Custo por km</h3>
              <p style="
                color: white;
                font-size: 20px;
                margin: 0;
                font-weight: bold;
              ">R$ ${report.costPerKm.toFixed(2)}/km</p>
            </div>
            
            <div style="
              background: rgba(255,255,255,0.1);
              padding: 20px;
              border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.2);
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            ">
              <div style="
                background: rgba(16, 185, 129, 0.2);
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;
                font-size: 20px;
              ">🛣️</div>
              <h3 style="
                color: #93c5fd;
                margin: 0 0 8px 0;
                font-size: 14px;
                font-weight: normal;
              ">Total Percorrido</h3>
              <p style="
                color: white;
                font-size: 20px;
                margin: 0;
                font-weight: bold;
              ">${report.totalKm.toFixed(0)} km</p>
            </div>

            <div style="
              background: rgba(255,255,255,0.1);
              padding: 20px;
              border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.2);
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            ">
              <div style="
                background: rgba(236, 72, 153, 0.2);
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;
                font-size: 20px;
              ">⛽</div>
              <h3 style="
                color: #93c5fd;
                margin: 0 0 8px 0;
                font-size: 14px;
                font-weight: normal;
              ">Preço Médio</h3>
              <p style="
                color: white;
                font-size: 20px;
                margin: 0;
                font-weight: bold;
              ">R$ ${report.averageFuelPrice.toFixed(2)}/l</p>
            </div>
          </div>
        </div>
      `;

      try {
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#1E293B',
          width: 1024,
          height: 600,
          foreignObjectRendering: false,
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const x = 10;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        const today = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        pdf.text(`Relatório gerado em: ${today}`, 10, pageHeight - 5);
        pdf.text(`Página ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth - 20, pageHeight - 5, { align: 'right' });

      } catch (error) {
        console.error(`Erro ao gerar relatório para ${car.model}:`, error);
        throw error;
      }
    }

    document.body.removeChild(tempDiv);
    pdf.save(`relatorios-frota-${format(month, 'MM-yyyy')}.pdf`);

  } catch (error) {
    console.error('Erro ao gerar PDF em lote:', error);
    throw error;
  }
};

export const calculateKmSinceOilChange = (
  entries: FuelEntry[],
  lastOilChangeDate: string | null,
  lastOilChangeKm: number | null
): number => {
  // Se não tiver informações suficientes, retorna 0
  if (!lastOilChangeDate || lastOilChangeKm === null) return 0;

  // Converter a data da última troca para um objeto Date para comparação
  const oilChangeDate = new Date(lastOilChangeDate);
  
  // Filtrar apenas entradas após a data da última troca de óleo
  const entriesAfterOilChange = entries.filter(entry => 
    new Date(entry.date) >= oilChangeDate
  );
  
  // Se não houver entradas após a troca de óleo, retorna 0
  if (entriesAfterOilChange.length === 0) return 0;
  
  // Ordenar as entradas por data (da mais antiga para a mais recente)
  const sortedEntries = [...entriesAfterOilChange].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Pegar a entrada mais recente para calcular a quilometragem atual
  const latestEntry = sortedEntries[sortedEntries.length - 1];
  
  // Retornar a diferença entre a quilometragem atual e a quilometragem na última troca
  return latestEntry.currentKm - lastOilChangeKm;
};

export const getOilChangeStatus = (
  kmSinceLastChange: number,
  lastOilChangeDate: string | null
) => {
  if (!lastOilChangeDate) return null;

  const monthsSinceChange = differenceInMonths(
    new Date(),
    new Date(lastOilChangeDate)
  );

  // Limites para troca de óleo
  const KM_LIMIT = 8000; // Alterado para 8.000 km conforme solicitado
  const KM_WARNING = 7000; // 1.000 km antes do limite para aviso
  const MONTH_LIMIT = 12;
  const MONTH_WARNING = 11;

  if (kmSinceLastChange >= KM_LIMIT || monthsSinceChange >= MONTH_LIMIT) {
    return {
      color: 'bg-red-100 border-red-200',
      textColor: 'text-red-800',
      message: 'Troca de óleo necessária'
    };
  } else if (kmSinceLastChange >= KM_WARNING || monthsSinceChange >= MONTH_WARNING) {
    return {
      color: 'bg-yellow-100 border-yellow-200',
      textColor: 'text-yellow-800',
      message: 'Troca de óleo próxima'
    };
  } else {
    return {
      color: 'bg-green-100 border-green-200',
      textColor: 'text-green-800',
      message: 'Óleo em dia'
    };
  }
};

// Funções para exportação de relatórios de manutenção
export const exportMaintenanceDataToPDF = async (
  car: Car | null, 
  records: MaintenanceRecord[],
  month: Date | null = null,
  allCars: Car[] = []
): Promise<void> => {
  try {
    // Importar jsPDF dinamicamente
    const jsPDF = (await import('jspdf')).default;
    // Importar jspdf-autotable
    const autoTable = (await import('jspdf-autotable')).default;
    
    // Criar novo documento PDF
    const doc = new jsPDF();
    
    // Definição de cores
    const primaryColor: [number, number, number] = [218, 68, 83]; // Vermelho
    const secondaryColor: [number, number, number] = [255, 153, 0]; // Laranja
    const darkBlue: [number, number, number] = [24, 51, 88];
    const lightGray: [number, number, number] = [245, 245, 245];
    const darkGray: [number, number, number] = [100, 100, 100];
    const white: [number, number, number] = [255, 255, 255];
    
    // Adicionar cabeçalho com gradient simulado
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, 'F');
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 40, doc.internal.pageSize.getWidth(), 5, 'F');
    
    // Adicionar título com fonte branca
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const title = car 
      ? `Relatório de Manutenção` 
      : 'Relatório de Manutenção';
    
    doc.text(title, 14, 20);
    doc.setFontSize(14);
    const subtitle = car 
      ? `${car.model} (${car.licensePlate})` 
      : 'Todos os Veículos';
    doc.text(subtitle, 14, 30);
    
    // Seção de informações
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(10, 55, doc.internal.pageSize.getWidth() - 20, 35, 3, 3, 'FD');
    
    // Adicionar período e informações
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    let periodText = '';
    if (month) {
      periodText = `Período: ${format(month, 'MMMM/yyyy', { locale: ptBR })}`;
    } else {
      periodText = `Período: Completo`;
    }
    
    doc.text(periodText, 15, 65);
    
    // Calcular total gasto
    const totalSpent = records.reduce((sum, record) => sum + record.cost, 0);
    
    // Adicionar resumo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 15, 73);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.text(`Total de Registros: ${records.length}`, 15, 82);
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setTextColor(255, 255, 255);
    doc.roundedRect(doc.internal.pageSize.getWidth() - 100, 72, 85, 12, 3, 3, 'F');
    doc.text(`Total Gasto: R$ ${totalSpent.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, doc.internal.pageSize.getWidth() - 95, 80);
    
    // Agrupar registros por mês se não houver filtro de mês específico
    let tableData: any[] = [];
    let currentMonthYear = '';
    let monthSubtotal = 0;
    
    // Criar um mapa para buscar informações do veículo por id
    const carMap = new Map<string, Car>();
    if (allCars && Array.isArray(allCars)) {
      allCars.forEach(c => carMap.set(c.id, c));
    }
    
    // Definir cabeçalhos da tabela - Adicionar coluna "Veículo" se estiver exibindo todos os veículos
    const headers = car 
      ? ['Data', 'Local', 'Descrição', 'KM', 'Valor (R$)']
      : ['Data', 'Veículo', 'Local', 'Descrição', 'KM', 'Valor (R$)'];
    
    if (!month && records.length > 0) {
      // Ordenar registros por data (do mais recente ao mais antigo)
      const sortedRecords = [...records].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      for (const record of sortedRecords) {
        const recordDate = parseISO(record.date);
        const monthYear = format(recordDate, 'MMMM/yyyy', { locale: ptBR });
        
        // Se mudou o mês, adiciona uma linha de cabeçalho do mês
        if (monthYear !== currentMonthYear) {
          // Se não for o primeiro mês, adiciona subtotal do mês anterior
          if (currentMonthYear !== '' && monthSubtotal > 0) {
            tableData.push([
              '', '', 
              {
                content: `Subtotal ${currentMonthYear}:`,
                styles: { fontStyle: 'bold' as const, fillColor: [240, 240, 240] as [number, number, number] }
              }, 
              '',
              {
                content: `R$ ${monthSubtotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                styles: { fontStyle: 'bold' as const, fillColor: [240, 240, 240] as [number, number, number] }
              }
            ]);
          }
          
          tableData.push([
            {
              content: monthYear.toUpperCase(),
              colSpan: 5,
              styles: { 
                halign: 'left' as const, 
                fillColor: secondaryColor as [number, number, number], 
                textColor: [255, 255, 255] as [number, number, number],
                fontStyle: 'bold' as const
              }
            }
          ]);
          
          currentMonthYear = monthYear;
          monthSubtotal = 0;
        }
        
        monthSubtotal += record.cost;
        
        // Para relatório de todos os veículos, incluir o modelo do veículo
        if (!car) {
          const recordCar = carMap.get(record.carId);
          const vehicleInfo = recordCar 
            ? `${recordCar.model} (${recordCar.licensePlate})`
            : 'Veículo não encontrado';
          
          tableData.push([
            format(recordDate, 'dd/MM/yyyy'),
            vehicleInfo,
            record.location,
            record.issueDescription.length > 40
              ? `${record.issueDescription.substring(0, 40)}...`
              : record.issueDescription,
            record.currentKm ? record.currentKm.toLocaleString() : '-',
            record.cost.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})
          ]);
        } else {
          tableData.push([
            format(recordDate, 'dd/MM/yyyy'),
            record.location,
            record.issueDescription.length > 40
              ? `${record.issueDescription.substring(0, 40)}...`
              : record.issueDescription,
            record.currentKm ? record.currentKm.toLocaleString() : '-',
            record.cost.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})
          ]);
        }
      }
      
      // Adicionar o último subtotal
      if (currentMonthYear !== '' && monthSubtotal > 0) {
        tableData.push([
          '', '', 
          {
            content: `Subtotal ${currentMonthYear}:`,
            styles: { fontStyle: 'bold' as const, fillColor: [240, 240, 240] as [number, number, number] }
          }, 
          '',
          {
            content: `R$ ${monthSubtotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            styles: { fontStyle: 'bold' as const, fillColor: [240, 240, 240] as [number, number, number] }
          }
        ]);
      }
    } else {
      // Se houver filtro de mês ou poucos registros, mostra na forma simples
      tableData = records.map(record => {
        if (!car) {
          const recordCar = carMap.get(record.carId);
          const vehicleInfo = recordCar 
            ? `${recordCar.model} (${recordCar.licensePlate})`
            : 'Veículo não encontrado';
          
          return [
            format(parseISO(record.date), 'dd/MM/yyyy'),
            vehicleInfo,
            record.location,
            record.issueDescription.length > 40
              ? `${record.issueDescription.substring(0, 40)}...`
              : record.issueDescription,
            record.currentKm ? record.currentKm.toLocaleString() : '-',
            record.cost.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})
          ];
        } else {
          return [
            format(parseISO(record.date), 'dd/MM/yyyy'),
            record.location,
            record.issueDescription.length > 40
              ? `${record.issueDescription.substring(0, 40)}...`
              : record.issueDescription,
            record.currentKm ? record.currentKm.toLocaleString() : '-',
            record.cost.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})
          ];
        }
      });
    }
    
    // Gerar tabela
    autoTable(doc, {
      startY: 100,
      head: [headers],
      body: tableData,
      headStyles: {
        fillColor: primaryColor,
        textColor: white,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      columnStyles: car 
        ? {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 35 },
            2: { cellWidth: 80 },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 25, halign: 'right' }
          }
        : {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 40 },
            2: { cellWidth: 30 },
            3: { cellWidth: 55 },
            4: { cellWidth: 15, halign: 'center' },
            5: { cellWidth: 20, halign: 'right' }
          },
      margin: { top: 100 },
      styles: {
        fontSize: 9
      },
      didDrawPage: (data) => {
        // Cabeçalho de todas as páginas após a primeira
        if (data.pageNumber > 1) {
          // Adicionar barra colorida no topo
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(0, 0, doc.internal.pageSize.getWidth(), 15, 'F');
          doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.rect(0, 15, doc.internal.pageSize.getWidth(), 3, 'F');
          
          // Texto do cabeçalho
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(title, 14, 10);
        }
        
        // Adicionar rodapé em todas as páginas
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        
        // Linha do rodapé
        doc.setDrawColor(200, 200, 200);
        doc.line(10, pageHeight - 15, pageSize.getWidth() - 10, pageHeight - 15);
        
        // Texto do rodapé
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${data.pageNumber}`, 14, pageHeight - 10);
        doc.text('Sistema de Gestão de Frotas', pageSize.width / 2, pageHeight - 10, { align: 'center' });
        doc.text(format(new Date(), 'dd/MM/yyyy'), pageSize.width - 14, pageHeight - 10, { align: 'right' });
      }
    });

    // Nome do arquivo
    const fileName = car 
      ? `manutencao_${car.model.replace(/\s+/g, '_').toLowerCase()}_${car.licensePlate}_${month ? format(month, 'MM-yyyy') : 'completo'}.pdf`
      : `manutencao_todos_veiculos_${month ? format(month, 'MM-yyyy') : 'completo'}.pdf`;
    
    // Salvar o arquivo
    doc.save(fileName);
  } catch (error) {
    console.error('Erro ao exportar dados de manutenção:', error);
  }
};

export const exportMaintenanceDataToExcel = async (
  cars: Car[],
  records: MaintenanceRecord[], 
  month: Date | null = null
): Promise<void> => {
  try {
    // Importar xlsx dinamicamente
    const XLSX = await import('xlsx');
    
    // Mapear registros para agrupar por carro
    const recordsByCarId = new Map<string, MaintenanceRecord[]>();
    
    // Inicializar mapa com todos os carros (mesmo sem registros)
    cars.forEach(car => {
      recordsByCarId.set(car.id, []);
    });
    
    // Filtrar por mês, se especificado
    let filteredRecords = records;
    if (month) {
      const startOfMonthDate = startOfMonth(month);
      const endOfMonthDate = endOfMonth(month);
      filteredRecords = records.filter(record => {
        const recordDate = parseISO(record.date);
        return isWithinInterval(recordDate, { start: startOfMonthDate, end: endOfMonthDate });
      });
    }
    
    // Agrupar registros por carro
    filteredRecords.forEach(record => {
      if (recordsByCarId.has(record.carId)) {
        recordsByCarId.get(record.carId)?.push(record);
      } else {
        recordsByCarId.set(record.carId, [record]);
      }
    });
    
    // Criar um workbook vazio
    const wb = XLSX.utils.book_new();
    
    // Criar uma planilha de resumo
    const summaryData = [] as any[];
    
    // Adicionar cabeçalho do resumo
    summaryData.push(['Relatório de Manutenção - Resumo']);
    summaryData.push([
      'Período:', month ? format(month, 'MMMM/yyyy', { locale: ptBR }) : 'Todos os registros'
    ]);
    summaryData.push(['Gerado em:', format(new Date(), 'dd/MM/yyyy HH:mm')]);
    summaryData.push([]);
    summaryData.push(['Veículo', 'Placa', 'Total Registros', 'Total Gasto (R$)']);
    
    // Adicionar dados de cada veículo no resumo
    let grandTotal = 0;
    let grandTotalRecords = 0;
    
    cars.forEach(car => {
      const carRecords = recordsByCarId.get(car.id) || [];
      const totalSpent = carRecords.reduce((sum, record) => sum + record.cost, 0);
      grandTotal += totalSpent;
      grandTotalRecords += carRecords.length;
      
      if (carRecords.length > 0) {
        summaryData.push([
          car.model,
          car.licensePlate,
          carRecords.length,
          totalSpent.toFixed(2)
        ]);
      }
    });
    
    // Adicionar total geral
    summaryData.push([]);
    summaryData.push(['Total Geral', '', grandTotalRecords, grandTotal.toFixed(2)]);
    
    // Criar a planilha de resumo
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo');
    
    // Criar uma planilha detalhada para cada veículo com registros
    cars.forEach(car => {
      const carRecords = recordsByCarId.get(car.id) || [];
      
      // Só criar planilha se tiver registros
      if (carRecords.length > 0) {
        // Ordenar por data (mais recente primeiro)
        carRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const detailsData = [] as any[];
        
        // Adicionar cabeçalho
        detailsData.push([`Manutenções - ${car.model} (${car.licensePlate})`]);
        detailsData.push([]);
        detailsData.push(['Data', 'Local', 'Descrição', 'KM', 'Valor (R$)', 'Observações']);
        
        // Adicionar cada registro
        carRecords.forEach(record => {
          detailsData.push([
            format(parseISO(record.date), 'dd/MM/yyyy'),
            record.location,
            record.issueDescription,
            record.currentKm ? record.currentKm.toLocaleString() : '-',
            record.cost.toFixed(2),
            record.notes || ''
          ]);
        });
        
        // Adicionar total
        const totalSpent = carRecords.reduce((sum, record) => sum + record.cost, 0);
        detailsData.push([]);
        detailsData.push(['Total', '', '', '', totalSpent.toFixed(2), '']);
        
        // Criar a planilha e adicionar ao workbook
        const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
        XLSX.utils.book_append_sheet(wb, detailsWs, car.model.substring(0, 31));
      }
    });
    
    // Nome do arquivo
    const fileName = `manutencao_veiculos_${month ? format(month, 'MM-yyyy') : 'completo'}.xlsx`;
    
    // Salvar o arquivo
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error('Erro ao exportar dados de manutenção:', error);
  }
};

export const exportAllMaintenanceData = async (
  cars: Car[],
  userId: string,
  month: Date | null = null,
  year: number | null = null,
  exportType: 'pdf' | 'excel' = 'pdf'
): Promise<boolean> => {
  try {
    // Buscar todos os registros de manutenção do usuário
    let query = supabase
      .from('maintenance_records')
      .select('*')
      .eq('user_id', userId);
    
    // Aplicar filtro por mês/ano se necessário
    if (month && year) {
      const startDate = new Date(year, month.getMonth(), 1);
      const endDate = endOfMonth(startDate);
      query = query
        .gte('maintenance_date', format(startDate, 'yyyy-MM-dd'))
        .lte('maintenance_date', format(endDate, 'yyyy-MM-dd'));
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      query = query
        .gte('maintenance_date', format(startDate, 'yyyy-MM-dd'))
        .lte('maintenance_date', format(endDate, 'yyyy-MM-dd'));
    }
    
    // Ordenar por data decrescente
    query = query.order('maintenance_date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Mapear os dados
    const records = data.map(record => ({
      id: record.id,
      carId: record.car_id,
      userId: record.user_id,
      date: record.maintenance_date,
      location: record.location,
      issueDescription: record.issue_description,
      cost: record.cost,
      currentKm: record.current_km,
      notes: record.notes || null,
      createdAt: record.created_at
    })) as MaintenanceRecord[];
    
    // Exportar dependendo do tipo
    if (exportType === 'pdf') {
      await exportMaintenanceDataToPDF(null, records, month, cars);
    } else {
      await exportMaintenanceDataToExcel(cars, records, month);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar dados de manutenção:', error);
    return false;
  }
};

export const exportCarMaintenanceData = async (
  car: Car,
  userId: string,
  month: Date | null = null,
  year: number | null = null,
  exportType: 'pdf' | 'excel' = 'pdf'
): Promise<boolean> => {
  try {
    // Buscar registros de manutenção do veículo específico
    let query = supabase
      .from('maintenance_records')
      .select('*')
      .eq('user_id', userId)
      .eq('car_id', car.id);
    
    // Aplicar filtro por mês/ano se necessário
    if (month && year) {
      const startDate = new Date(year, month.getMonth(), 1);
      const endDate = endOfMonth(startDate);
      query = query
        .gte('maintenance_date', format(startDate, 'yyyy-MM-dd'))
        .lte('maintenance_date', format(endDate, 'yyyy-MM-dd'));
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      query = query
        .gte('maintenance_date', format(startDate, 'yyyy-MM-dd'))
        .lte('maintenance_date', format(endDate, 'yyyy-MM-dd'));
    }
    
    // Ordenar por data decrescente
    query = query.order('maintenance_date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Mapear os dados
    const records = data.map(record => ({
      id: record.id,
      carId: record.car_id,
      userId: record.user_id,
      date: record.maintenance_date,
      location: record.location,
      issueDescription: record.issue_description,
      cost: record.cost,
      currentKm: record.current_km,
      notes: record.notes || null,
      createdAt: record.created_at
    })) as MaintenanceRecord[];
    
    // Exportar dependendo do tipo
    if (exportType === 'pdf') {
      await exportMaintenanceDataToPDF(car, records, month, [car]);
    } else {
      await exportMaintenanceDataToExcel([car], records, month);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar dados de manutenção para veículo:', error);
    return false;
  }
};