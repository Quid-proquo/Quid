import React from "react";

const TaskInfo = () => {
  const steps = [
    "Visit the product link provided on this page and test the latest version of Ruze.stellar 2.0.",
    "Explore key features and interact with the product as a real user would.",
    "Take note of your experience, including usability, performance, bugs, or areas for improvement.",
    "Submit honest and detailed feedback in the response section. One-line answers may not be considered.",
    "Ensure your response is original and based on your own testing.",
  ];

  return (
    <div className="p-5 flex flex-col gap-6">
      <p className="">Thank you for participating in this survey.</p>

      <p className="py-6">
        {" "}
        Please follow the steps below to ensure your response is valid and
        eligible for review:
      </p>

      <ul className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <li key={index} className="list-decimal ml-4 pl-2">
            {step}
          </li>
        ))}
      </ul>
      <p className="">
        Responses are reviewed based on clarity, depth, and
        usefulness.Top-quality submissions will be selected for rewards.
      </p>
      <p className="">
        {" "}
        ⏱️ Make sure to submit your response before phe timer ends.
      </p>
    </div>
  );
};

export default TaskInfo;
