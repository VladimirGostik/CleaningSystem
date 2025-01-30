// src/components/DateSelector.js

import React from 'react';
import PropTypes from 'prop-types';

const DateSelector = ({ type, selectedMonth, selectedYear, onMonthChange, onYearChange }) => {
  const months = [
    { value: 1, name: 'Január' },
    { value: 2, name: 'Február' },
    { value: 3, name: 'Marec' },
    { value: 4, name: 'Apríl' },
    { value: 5, name: 'Máj' },
    { value: 6, name: 'Jún' },
    { value: 7, name: 'Júl' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'Október' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex items-center gap-4">
      {type === 'mesacna' && (
        <div className="flex items-center gap-2">
          <label htmlFor="month" className="font-semibold">Mesiac:</label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex items-center gap-2">
        <label htmlFor="year" className="font-semibold">Rok:</label>
        <select
          id="year"
          value={selectedYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-1"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

DateSelector.propTypes = {
  type: PropTypes.string.isRequired,
  selectedMonth: PropTypes.number.isRequired,
  selectedYear: PropTypes.number.isRequired,
  onMonthChange: PropTypes.func.isRequired,
  onYearChange: PropTypes.func.isRequired,
};

export default DateSelector;
