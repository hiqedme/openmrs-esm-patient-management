import React from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { type CalendarType, type DailyAppointmentsCountByService } from '../../types';
import { monthDays } from '../../helpers';
import MonthlyViewWorkload from './monthly-workload-view.component';
import MonthlyHeader from './monthly-header.module';
import styles from '../appointments-calendar-view-view.scss';

dayjs.extend(isBetween);

interface MonthlyCalendarViewProps {
  type: CalendarType;
  events: Array<DailyAppointmentsCountByService>;
  currentDate: Dayjs;
  setCurrentDate: (date) => void;
}

const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({ type, events, currentDate, setCurrentDate }) => {
  return (
    <div className={styles.calendarViewContainer}>
      <MonthlyHeader type={type} currentDate={currentDate} setCurrentDate={setCurrentDate} />
      <div className={styles.wrapper}>
        {type === 'monthly' ? (
          <div className={styles.monthlyCalendar}>
            {monthDays(currentDate).map((dateTime, i) => (
              <MonthlyViewWorkload key={i} type={type} dateTime={dateTime} currentDate={currentDate} events={events} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MonthlyCalendarView;
