import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminEmailInputProps {
  value: string;
  onChange: (value: string) => void;
}

const AdminEmailInput = ({ value, onChange }: AdminEmailInputProps) => {
  const [prefix, setPrefix] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Extract prefix before @goensol.com
    if (inputValue.includes("@goensol.com")) {
      const newPrefix = inputValue.split("@goensol.com")[0];
      setPrefix(newPrefix);
      onChange(`${newPrefix}@goensol.com`);
    } else if (!inputValue.includes("@")) {
      // If no @ symbol, treat entire input as prefix
      setPrefix(inputValue);
      onChange(`${inputValue}@goensol.com`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const value = input.value;
    const cursorPosition = input.selectionStart || 0;
    
    // Prevent deletion of @goensol.com
    if ((e.key === 'Backspace' || e.key === 'Delete') && 
        cursorPosition >= value.indexOf('@goensol.com')) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="admin-email">Adresse email Ensol</Label>
      <Input
        id="admin-email"
        type="email"
        value={value || "@goensol.com"}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="nom@goensol.com"
      />
    </div>
  );
};

export default AdminEmailInput;