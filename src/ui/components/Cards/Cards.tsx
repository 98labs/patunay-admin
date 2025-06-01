interface Props {
    title?: string;
    message?: any;
    variant?: 'primary' | 'secondary' | 'accent' | 'neutral';
    className?: string;
  }
  
  const Cards = ({
    title,
    message,
    variant = 'primary',
    className = '',
  }: Props) => {

    const variantClasses = {
      primary: 'bg-primary dark:bg-primary text-primary-content dark:text-primary-content',
      secondary: 'bg-secondary dark:bg-secondary text-secondary-content dark:text-secondary-content',
      accent: 'bg-accent dark:bg-accent text-accent-content dark:text-accent-content',
      neutral: 'bg-base-200 dark:bg-base-200 text-base-content dark:text-base-content border border-base-300 dark:border-base-300'
    };
  
    return (
        <div className={`card ${variantClasses[variant]} w-96 shadow-lg ${className}`}>
        <div className="card-body">
          <h2 className="card-title font-semibold">{title}</h2>
          <div className="text-sm opacity-90">{message}</div>
        </div>
      </div>
    );
  };
  
  export default Cards;
  