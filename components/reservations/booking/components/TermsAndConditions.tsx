'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Text, 
  Stack, 
  Checkbox, 
  ScrollArea, 
  Title,
  List,
  ThemeIcon
} from '@mantine/core';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface TermsAndConditionsProps {
  accepted: boolean;
  onAcceptanceChange: (accepted: boolean) => void;
}

export default function TermsAndConditions({ 
  accepted, 
  onAcceptanceChange 
}: TermsAndConditionsProps) {
  return (
    <Card shadow="sm" p="xl" radius="md" withBorder>
      <Stack gap="md">
        <div>
          <Text size="xl" fw={700} mb="xs" ta="center">
            Términos y Condiciones del Servicio
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Al confirmar su reservación, usted acepta y se compromete a cumplir con las siguientes disposiciones.
          </Text>
        </div>

        <Text size="sm" style={{ lineHeight: 1.6 }}>
          Tramboory establece las presentes condiciones contractuales con el objeto de brindar un servicio 
          de calidad y garantizar la seguridad de todos los usuarios. El cumplimiento de estas disposiciones es obligatorio 
          y su incumplimiento podrá dar lugar a la aplicación de las sanciones aquí previstas.
        </Text>

        <ScrollArea h={400} style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px', padding: '16px' }}>
          <Stack gap="sm">
            <div>
              <Text fw={600} size="sm" mb="xs">1. Del Anticipo y Apartado de Fecha</Text>
              <Text size="sm">
                Para formalizar la reservación del evento, el contratante deberá entregar un anticipo por la cantidad de $2,000.00 
                (dos mil pesos 00/100 M.N.), mismo que servirá para garantizar la fecha solicitada.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">2. Del Régimen de Pagos</Text>
              <Text size="sm">
                El contratante se obliga a cubrir el 50% del monto total del servicio contratado con 30 días naturales de 
                anticipación a la fecha del evento. El saldo restante deberá liquidarse 15 días naturales antes de la 
                celebración programada.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">3. De las Cancelaciones</Text>
              <Text size="sm">
                En caso de cancelación del evento por parte del contratante, no procederá devolución alguna del anticipo 
                entregado, el cual quedará en poder de Tramboory como compensación por los gastos administrativos y 
                la pérdida de oportunidad comercial.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">4. De las Modificaciones de Fecha</Text>
              <Text size="sm">
                Las solicitudes de cambio de fecha deberán presentarse con un mínimo de 20 días naturales de anticipación 
                a la fecha originalmente contratada. Toda modificación estará sujeta a disponibilidad de espacios y 
                no generará costo adicional siempre que se cumplan los términos aquí establecidos.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">5. De los Servicios de Terceros</Text>
              <Text size="sm">
                El ingreso de servicios externos de alimentación o entretenimiento deberá ser autorizado por la administración 
                con un mínimo de 7 días naturales de anticipación. Esta medida tiene por objeto coordinar adecuadamente la 
                logística del evento y garantizar la calidad del servicio.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">6. Del Cumplimiento de Horarios</Text>
              <Text size="sm">
                El evento dará inicio puntualmente a la hora contratada. Se recomienda que los responsables del evento 
                se presenten 15 minutos antes del horario programado para realizar los preparativos necesarios.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">7. Del Régimen de Alimentos y Bebidas</Text>
              <Text size="sm">
                En cumplimiento de las normas sanitarias vigentes, queda prohibido el ingreso de alimentos y bebidas externos 
                a las instalaciones. Se exceptúan de esta restricción únicamente: mesa de dulces, botanas y pastel de 
                cumpleaños, previa autorización expresa de la administración.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">8. De los Artículos y Sustancias Prohibidas</Text>
              <Text size="sm">
                Queda estrictamente prohibido el ingreso de los siguientes elementos: chicles, confeti, espuma, slime, 
                gelatina, pintura, plastilinas, arena kinética, masilla, aceites comestibles para juegos, glitter, 
                polvos de colores, líquidos derramables en recipientes abiertos, aerosoles o cualquier sustancia viscosa 
                que pueda adherirse a superficies o generar residuos de difícil remoción.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">9. Responsabilidad por Daños</Text>
              <Text size="sm">
                Cualquier daño a las instalaciones de Tramboory serán responsabilidad del usuario responsable del evento contratado.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">10. Lesiones y Accidentes</Text>
              <Text size="sm">
                La empresa no se hace responsable de lesiones o accidentes derivadas por mal uso de las instalaciones. 
                Queda prohibido realizar acrobacias que pongan en riesgo la integridad de las personas.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">11. Excedentes</Text>
              <Text size="sm">
                En caso de exceder el horario o número de personas contratadas se deberá pagar dicho excedente al final del evento. 
                Tramboory siempre cuenta con 10 platillos extras a los contratados en caso de ser necesarios. Todo invitado deberá 
                portar brazalete y los mismos solo tendrán validez el día de tu evento, por tanto brazalete no usado no se entregará 
                por ningún motivo.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">12. Espectáculos con Fuego</Text>
              <Text size="sm">
                Por la seguridad de los invitados, equipo de trabajo e instalaciones, quedan prohibidos los espectáculos que se 
                realizan con fuego (traga fuegos, malabares con fuego, pirotecnia, cohetes, bengalas, velas con llama abierta, 
                antorchas, mecheros tipo zippo, encendedores de cocina, soplete culinario y cualquier otro material que pudiera 
                propiciar un incendio o generar chispas). De hacer caso omiso a este punto podrán hacerse acreedores a una multa 
                a estipular por la administración que dependerá del daño o posible daño a las instalaciones.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">13. Platillos para Llevar</Text>
              <Text size="sm">
                El cliente podrá llevarse un máximo de 10 platillos en caso de no cubrir los invitados en el paquete contratado.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">14. Horario de Cocina</Text>
              <Text size="sm">
                Plancha y freidora se apagará 2.5 horas después de que comience el evento (platillos extra se deberán pedir 
                dentro de este tiempo).
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">15. Tiempo de Despedida</Text>
              <Text size="sm">
                En tu paquete se incluyen 30 minutos para despedida. Una vez finalizado el evento se comenzará a limpiar y 
                levantar sillas. Cuentan con 15 minutos extra para recoger pertenencias. En caso de no respetar este tiempo 
                se cobrará hora extra.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">16. Servicios Adicionales</Text>
              <Text size="sm">
                Cualquier servicio extra se debe agregar mínimo 1 semana antes. En caso de pasar de este tiempo se deberá 
                preguntar por disponibilidad del servicio.
              </Text>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">17. Cambios de Temática</Text>
              <Text size="sm">
                Una vez seleccionada la temática de tu evento no se pueden hacer cambios.
              </Text>
            </div>
          </Stack>
        </ScrollArea>

        <Checkbox
          checked={accepted}
          onChange={(event) => onAcceptanceChange(event.currentTarget.checked)}
          label={
            <Text size="sm">
              He leído y acepto los términos y condiciones del contrato de servicio de Tramboory
            </Text>
          }
          size="md"
        />
      </Stack>
    </Card>
  );
}