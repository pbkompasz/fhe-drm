import { useParams } from "react-router-dom";

const Collection = () => {
  const { id } = useParams();

  return (
    <>
      collection: {id}
    </>
  );
};

export default Collection;
