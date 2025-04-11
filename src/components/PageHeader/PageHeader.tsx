interface Props {
  name: string;
}
const PageHeader = ({ name }: Props) => {
  return <h2 className="text-2xl font-semibold">{name}</h2>;
};

export default PageHeader;
