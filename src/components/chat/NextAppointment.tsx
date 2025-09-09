type NextAppointmentProps = {
  appointment: {
    title: string;
    day: string;
    date: string;
    time: string;
  } | null;
};

export function NextAppointment({ appointment }: NextAppointmentProps) {
  if (!appointment) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Próximo compromisso</h3>
      </div>

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white font-medium">
          {appointment.day}
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-800">{appointment.title}</span>
          <span className="text-xs text-gray-500">{`${appointment.date} ${appointment.time}`}</span>
        </div>
      </div>
    </div>
  );
} 