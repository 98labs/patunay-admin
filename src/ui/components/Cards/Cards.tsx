interface Props {
    title?: string;
    message?: any;
  }
  
  const Cards = ({
    title,
    message,
  }: Props) => {

  
    return (
        <div className="card bg-primary text-primary-content w-96">
        <div className="card-body">
          <h2 className="card-title">{title}</h2>
          {message}
        </div>
      </div>
    );
  };
  
  export default Cards;
  