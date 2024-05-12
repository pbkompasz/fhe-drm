import { useParams } from "react-router-dom";

const AVAILABLE_COLLECTIONS = [
  {
    name: "Onboarding documents",
    nftTypes: [
      {
        name: "HR",
        pemissions: ["create", "read", "update"],
      },
      {
        name: "Candidate",
        permissions: ["read"],
      },
    ],
  },
  {
    name: "Meeting Notes",
    nftTypes: [
      {
        name: "Organizer",
        pemissions: ["create", "read", "update", "delete"],
      },
      {
        name: "Employee",
        pemissions: ["create", "read"],
      },
      {
        name: "Temporary Attendance",
        pemissions: ["read"],
      },
    ],
  },
];

const Collection = () => {
  const { id } = useParams();

  return (
    <>
      collection: {id}
    </>
  );
};

export default Collection;
