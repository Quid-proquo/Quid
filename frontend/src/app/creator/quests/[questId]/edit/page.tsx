'use client'
import { use } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuestData } from "@/app/hooks/useQuestData";

export default function EditQuestPage({ params }: { params: Promise<{ questId: string }> }) {
  const { questId } = use(params);
  const router = useRouter();
  const { quest } = useQuestData(questId);

  const [formData, setFormData] = useState({
    title: quest?.title || "",
    description: quest?.description || "",
    reward: quest?.reward || "",
    deadline: quest?.deadline instanceof Date ? quest.deadline.toISOString().slice(0, 16) : (quest?.deadline as string | undefined) || "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/quests/${questId}`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });

      console.log("Updated quest:", formData);
      
      // Redirect back to quest detail
      router.push(`/creator/quests/${questId}`);
    } catch (error) {
      console.error("Error updating quest:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Edit Quest</h1>
          <p className="text-[#CFC9FF]">Quest ID: {questId}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#141026] rounded-2xl p-6 md:p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Quest Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-[#1B1540] border border-[#241B4A] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9011FF]"
              placeholder="Enter quest title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full bg-[#1B1540] border border-[#241B4A] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9011FF] resize-none"
              placeholder="Enter quest description"
            />
          </div>

          {/* Reward */}
          <div>
            <label className="block text-sm font-medium mb-2">Reward (XLM)</label>
            <input
              type="number"
              name="reward"
              value={formData.reward}
              onChange={handleChange}
              className="w-full bg-[#1B1540] border border-[#241B4A] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9011FF]"
              placeholder="Enter reward amount"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium mb-2">Deadline</label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full bg-[#1B1540] border border-[#241B4A] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9011FF]"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-4 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#9011FF] hover:bg-[#7d0dd4] disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-[#241B4A] hover:bg-[#2d2453] text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
