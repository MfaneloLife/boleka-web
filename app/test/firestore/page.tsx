"use client";

import { useState } from "react";
import { FirestoreService, UserFirestoreService, ItemFirestoreService } from "@/src/lib/firestore";

export default function FirestoreTestPage() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  };

  const addSampleUser = async () => {
    setIsLoading(true);
    try {
      const result = await UserFirestoreService.addUser({
        first: "Ada",
        last: "Lovelace",
        born: 1815,
        email: "ada@example.com"
      });

      if (result.success) {
        showMessage(`User added with ID: ${result.id}`);
        loadUsers(); // Refresh user list
      } else {
        showMessage(`Error: ${result.error}`, true);
      }
    } catch (error) {
      showMessage(`Error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const addSampleItem = async () => {
    setIsLoading(true);
    try {
      const result = await ItemFirestoreService.addItem({
        name: "Sample Product",
        description: "This is a test product",
        price: 99.99,
        category: "electronics",
        available: true
      });

      if (result.success) {
        showMessage(`Item added with ID: ${result.id}`);
        loadItems(); // Refresh items list
      } else {
        showMessage(`Error: ${result.error}`, true);
      }
    } catch (error) {
      showMessage(`Error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await UserFirestoreService.getUsers();
      if (result.success) {
        setUsers(result.data);
        showMessage(`Loaded ${result.data.length} users`);
      } else {
        showMessage(`Error loading users: ${result.error}`, true);
      }
    } catch (error) {
      showMessage(`Error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const result = await ItemFirestoreService.getItems();
      if (result.success) {
        setItems(result.data);
        showMessage(`Loaded ${result.data.length} items`);
      } else {
        showMessage(`Error loading items: ${result.error}`, true);
      }
    } catch (error) {
      showMessage(`Error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Firestore Database Test
          </h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Add Data Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Sample Data</h2>
              
              <button
                onClick={addSampleUser}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Adding..." : "Add Sample User"}
              </button>

              <button
                onClick={addSampleItem}
                disabled={isLoading}
                className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Adding..." : "Add Sample Item"}
              </button>
            </div>

            {/* Load Data Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Load Data</h2>
              
              <button
                onClick={loadUsers}
                disabled={isLoading}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Load Users"}
              </button>

              <button
                onClick={loadItems}
                disabled={isLoading}
                className="w-full bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Load Items"}
              </button>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg text-sm ${
              message.includes("Error") 
                ? "bg-red-100 text-red-700" 
                : "bg-green-100 text-green-700"
            }`}>
              {message}
            </div>
          )}

          {/* Data Display */}
          <div className="mt-8 grid md:grid-cols-2 gap-8">
            {/* Users */}
            {users.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Users ({users.length})</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {users.map((user, index) => (
                    <div key={user.id} className="mb-2 p-2 bg-white rounded border">
                      <p className="font-medium">{user.first} {user.last}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">ID: {user.id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            {items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Items ({items.length})</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={item.id} className="mb-2 p-2 bg-white rounded border">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-sm text-green-600">${item.price}</p>
                      <p className="text-xs text-gray-500">ID: {item.id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
