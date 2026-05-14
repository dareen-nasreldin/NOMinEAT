const Card = ({ children, className = '', onClick }) => {
  const clickable = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100 p-4
        ${clickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
