import React, { useState } from 'react';
import { Car, FuelEntry } from '../types';
import { Car as CarIcon, Trash2, Edit3, CheckCircle, X, Calendar, Hash, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { differenceInMonths, parseISO, addYears, format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { calculateKmSinceOilChange, getOilChangeStatus } from '../utils';

interface CarListProps {
  cars: Car[];
  selectedCarId: string | null;
  onSelectCar: (carId: string) => void;
  onDeleteCar: (id: string) => void;
  onEditCar: (car: Car) => void;
  onUpdateCar: (car: Car) => void;
  entries: FuelEntry[]; // Corrigindo o tipo para FuelEntry[]
  setCars: React.Dispatch<React.SetStateAction<Car[]>>;
}

export const CarList: React.FC<CarListProps> = ({ 
  cars, 
  selectedCarId, 
  onSelectCar, 
  onDeleteCar,
  onEditCar,
  onUpdateCar,
  entries,
  setCars
}) => {
  const [showOilChangeModal, setShowOilChangeModal] = useState(false);
  const [selectedCarForOilChange, setSelectedCarForOilChange] = useState<Car | null>(null);
  const [oilChangeDate, setOilChangeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [oilChangeMileage, setOilChangeMileage] = useState<number>(0);
  const [isOilChangeSubmitting, setIsOilChangeSubmitting] = useState<boolean>(false);
  const [expandedOilChangeCarId, setExpandedOilChangeCarId] = useState<string | null>(null);

  const getIpvaStatus = (dueDate: string | null) => {
    if (!dueDate) return null;

    const today = new Date();
    console.log('Data do IPVA (original):', dueDate);
    const ipvaDate = new Date(dueDate);
    console.log('Data do IPVA (objeto Date):', ipvaDate);
    const monthsUntilDue = differenceInMonths(ipvaDate, today);
    console.log('Meses até vencimento:', monthsUntilDue);

    if (monthsUntilDue < 0) {
      return {
        color: 'bg-red-200 border-red-300',
        textColor: 'text-red-800',
        message: 'IPVA vencido',
        showPaymentButton: true
      };
    } else if (monthsUntilDue > 3) {
      return {
        color: 'bg-green-100 border-green-200',
        textColor: 'text-green-800',
        message: 'IPVA em dia',
        showPaymentButton: false
      };
    } else if (monthsUntilDue >= 2) {
      return {
        color: 'bg-yellow-100 border-yellow-200',
        textColor: 'text-yellow-800',
        message: 'IPVA vence em breve',
        showPaymentButton: true
      };
    } else {
      return {
        color: 'bg-red-100 border-red-200',
        textColor: 'text-red-800',
        message: 'IPVA próximo ao vencimento',
        showPaymentButton: true
      };
    }
  };

  const handleIpvaPayment = async (car: Car, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!car.ipvaDueDate) return;

    try {
      const [year, month, day] = car.ipvaDueDate.split('-');
      console.log('Data atual do IPVA:', car.ipvaDueDate);
      console.log('Ano:', year, 'Mês:', month, 'Dia:', day);
      
      const nextYear = parseInt(year) + 1;
      const newDueDate = `${nextYear}-${month}-${day}`;
      console.log('Nova data de vencimento:', newDueDate);
      
      const { data, error } = await supabase
        .from('cars')
        .update({
          ipva_due_date: newDueDate
        })
        .eq('id', car.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating IPVA status:', error);
        return;
      }

      console.log('Data retornada do banco:', data.ipva_due_date);
      const updatedCar = {
        ...car,
        ipvaDueDate: data.ipva_due_date
      };

      onUpdateCar(updatedCar);
    } catch (error) {
      console.error('Error in handleIpvaPayment:', error);
    }
  };

  const formatIpvaDate = (isoDate: string) => {
    if (!isoDate) return '';
    try {
      console.log('Formatando data IPVA (original):', isoDate);
      // Em vez de criar um objeto Date, extrair diretamente da string para evitar problemas de timezone
      const [year, month] = isoDate.split('-');
      const formattedDate = `${month}/${year}`;
      console.log('Formatando data IPVA (resultado):', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('Erro ao formatar data do IPVA:', error);
      return '';
    }
  };

  const handleOilChange = (car: Car, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita a seleção do carro ao clicar no botão
    console.log('Preparando para troca de óleo do carro:', car.model);
    
    // Buscar os registros de abastecimento para este carro para sugerir a quilometragem atual
    const carEntries = entries.filter(entry => entry.carId === car.id);
    
    if (carEntries.length === 0) {
      alert('Não é possível registrar a troca de óleo sem pelo menos um registro de abastecimento');
      return;
    }
    
    // Ordenar entradas por data (mais recente primeiro)
    const sortedEntries = [...carEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Obter a quilometragem mais recente para sugerir como padrão
    const currentKm = sortedEntries[0].currentKm;
    
    // Expandir a seção de troca de óleo para este carro
    setOilChangeDate(new Date().toISOString().split('T')[0]); // Hoje como padrão
    setOilChangeMileage(currentKm);
    
    // Toggle: se já está expandido, fecha; se não, expande
    setExpandedOilChangeCarId(expandedOilChangeCarId === car.id ? null : car.id);
  };

  const handleOilChangeConfirm = async (car: Car, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      console.log('Registrando troca de óleo...');
      console.log('Carro:', car.model);
      console.log('Data:', oilChangeDate);
      console.log('Quilometragem:', oilChangeMileage);
      
      // Validar entrada
      if (!oilChangeDate || !oilChangeMileage) {
        alert('Por favor, preencha todos os campos.');
        return;
      }
      
      // Iniciar estado de loading
      setIsOilChangeSubmitting(true);
      
      // Atualizar o carro no banco de dados
      const { error } = await supabase
        .from('cars')
        .update({
          last_oil_change_date: oilChangeDate,
          last_oil_change_km: oilChangeMileage
        })
        .eq('id', car.id);
      
      if (error) {
        console.error('Erro ao registrar troca de óleo:', error);
        alert('Erro ao registrar troca de óleo: ' + error.message);
        return;
      }
      
      // Atualizar o estado local
      const updatedCar = {
        ...car,
        lastOilChangeDate: oilChangeDate,
        lastOilChangeKm: oilChangeMileage
      };
      
      setCars(cars.map(c => 
        c.id === updatedCar.id ? updatedCar : c
      ));
      
      // Fechar a seção expandida
      setExpandedOilChangeCarId(null);
      
      console.log('Troca de óleo registrada com sucesso!');
      alert('Troca de óleo registrada com sucesso!');
    } catch (err) {
      console.error('Erro inesperado:', err);
      alert('Ocorreu um erro inesperado. Por favor, tente novamente.');
    } finally {
      // Finalizar estado de loading
      setIsOilChangeSubmitting(false);
    }
  };

  const handleOilChangeNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOilChangeMileage(value === '' ? 0 : Number(value));
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-auto">
        {cars.map((car) => {
          const ipvaStatus = getIpvaStatus(car.ipvaDueDate);
          const isSelected = selectedCarId === car.id;
          const isOilChangeExpanded = expandedOilChangeCarId === car.id;
          
          const kmSinceOilChange = calculateKmSinceOilChange(
            entries.filter(entry => entry.carId === car.id),
            car.lastOilChangeDate,
            car.lastOilChangeKm
          );

          const oilStatus = getOilChangeStatus(kmSinceOilChange, car.lastOilChangeDate);
          const shouldShowOilChangeButton = oilStatus && (kmSinceOilChange >= 7000 || 
            (car.lastOilChangeDate && differenceInMonths(new Date(), new Date(car.lastOilChangeDate)) >= 11));
          
          // Determinar se deve mostrar a seção adicional
          const hasAdditionalInfo = car.ipvaDueDate || car.lastOilChangeDate;
          
          return (
            <div
              key={car.id}
              className={`
                relative p-6 rounded-xl border transition-all duration-300
                cursor-pointer group flex flex-col h-auto
                ${isSelected 
                  ? 'border-blue-500/50 bg-blue-500/10 shadow-xl scale-[1.02] rotate-1' 
                  : 'hover:shadow-lg hover:-translate-y-1 hover:bg-white/5 border-white/10 bg-white/5'
                }
                ${!hasAdditionalInfo ? 'pb-4' : ''}
                self-start
                transform perspective-1000
              `}
              onClick={() => onSelectCar(car.id)}
            >
              <div className={`
                absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0
                ${isSelected ? 'animate-shine' : 'opacity-0'}
                pointer-events-none
              `} />

              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCar(car);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
                  title="Editar Veículo"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCar(car.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                  title="Excluir Veículo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <CarIcon className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-200 truncate group-hover:text-blue-400 transition-colors duration-200">
                      {car.model}
                    </h3>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-400">Placa:</span>
                        <span className="text-sm font-semibold text-gray-300">{car.licensePlate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-400">Ano:</span>
                        <span className="text-sm font-semibold text-gray-300">{car.year}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(car.ipvaDueDate || car.lastOilChangeDate) && (
                  <div className={`mt-4 space-y-2 ${isOilChangeExpanded ? 'mb-0' : ''}`}>
                    {car.ipvaDueDate && (
                      <div className="flex items-center justify-between border-t border-white/10 pt-2">
                        <span className={`text-sm font-medium ${ipvaStatus?.textColor} flex-1`}>
                          {ipvaStatus?.message} - Vence em: {formatIpvaDate(car.ipvaDueDate)}
                        </span>
                        {ipvaStatus?.showPaymentButton && (
                          <button
                            onClick={(e) => handleIpvaPayment(car, e)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-400 bg-green-400/10 rounded-lg hover:bg-green-400/20 transition-all duration-200"
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            IPVA Pago
                          </button>
                        )}
                      </div>
                    )}
                    {car.lastOilChangeDate && (
                      <div 
                        className="flex flex-col border-t border-white/10 pt-2 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col w-full mb-2">
                          <span className={`text-sm font-medium ${oilStatus?.textColor}`}>
                            {oilStatus?.message} - {kmSinceOilChange.toLocaleString()}km desde a última troca
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            Última troca: {format(new Date(car.lastOilChangeDate), 'dd/MM/yyyy')} - 
                            {car.lastOilChangeKm && ` Hodômetro: ${car.lastOilChangeKm.toLocaleString()}km`}
                          </span>
                        </div>
                        
                        {shouldShowOilChangeButton && (
                          <div
                            className="w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              data-car-id={car.id}
                              data-action="oil-change"
                              onClick={(e) => {
                                console.log('Botão clicado!');
                                e.preventDefault();
                                e.stopPropagation();
                                handleOilChange(car, e);
                              }}
                              className="inline-flex items-center px-4 py-2 mt-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-200 z-20 shadow-sm hover:shadow-md active:scale-95 w-full justify-center cursor-pointer"
                            >
                              {isOilChangeExpanded ? (
                                <>
                                  <ChevronUp className="w-5 h-5 mr-2" />
                                  Ocultar Formulário
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                  Registrar Troca de Óleo
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        
                        {/* Seção expansível para registrar troca de óleo */}
                        {isOilChangeExpanded && (
                          <div className="mt-4 border-t-2 border-gray-700 pt-4 bg-gray-900 rounded-lg p-4 shadow-lg">
                            <div className="flex flex-col space-y-4">
                              <div>
                                <div className="flex items-center mb-2">
                                  <Calendar className="h-5 w-5 text-blue-400 mr-2" />
                                  <label htmlFor={`date-${car.id}`} className="text-white text-sm font-medium">
                                    Data da troca
                                  </label>
                                </div>
                                <input
                                  type="date"
                                  id={`date-${car.id}`}
                                  value={oilChangeDate}
                                  onChange={(e) => setOilChangeDate(e.target.value)}
                                  className="w-full h-12 rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                                />
                              </div>
                              
                              <div>
                                <div className="flex items-center mb-2">
                                  <Hash className="h-5 w-5 text-blue-400 mr-2" />
                                  <label htmlFor={`mileage-${car.id}`} className="text-white text-sm font-medium">
                                    Quilometragem
                                  </label>
                                </div>
                                <input
                                  type="number"
                                  id={`mileage-${car.id}`}
                                  value={oilChangeMileage || ''}
                                  onChange={handleOilChangeNumberInput}
                                  className="w-full h-12 rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                                />
                              </div>
                              
                              <div className="flex space-x-3 mt-2">
                                <button
                                  onClick={(e) => setExpandedOilChangeCarId(null)}
                                  className="flex-1 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition font-medium"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={(e) => handleOilChangeConfirm(car, e)}
                                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition font-medium flex items-center justify-center"
                                  disabled={isOilChangeSubmitting}
                                >
                                  {isOilChangeSubmitting ? (
                                    <span className="flex items-center">
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Salvando...
                                    </span>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Confirmar
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};