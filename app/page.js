'use client'
import Image from "next/image";
import { useState, useEffect } from "react";
import { firestore, auth, signUp, signIn, logOut, onAuthStateChange } from "@/firebase";
import { Box, Typography, Modal, Stack, TextField, Button, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { query, collection, getDocs, setDoc, doc, deleteDoc, getDoc } from "firebase/firestore";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [authError, setAuthError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditMode(true);
  };
  
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setEditMode(false);
  };

  const handleEditSave = async () => {
    if (!selectedItem) return;
    const docRef = doc(collection(firestore, "inventory"), selectedItem.name);
    await setDoc(docRef, {
      quantity: selectedItem.quantity,
      description: selectedItem.description || "",
      price: selectedItem.price || 0,
      category: selectedItem.category || "uncategorized",
    });
    setEditMode(false);
    await updateInventory();
  };

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, "inventory"));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ 
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
    setFilteredInventory(inventoryList);
  };

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);

    if (!user) {
      setAuthError("You must be logged in to add items.");
      return;
    }

    if (docSnap.exists()) {
      const {quantity} = docSnap.data();
      await setDoc(docRef, {quantity: quantity + 1,});
    }
    else {
      await setDoc(docRef, {quantity: 1,});
    }

    await updateInventory();
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);

    if (!user) {
      setAuthError("You must be logged in to remove items.");
      return;
    }

    if (docSnap.exists()) {
      const {quantity} = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {quantity: quantity - 1,});
      }
    }

    await updateInventory();
  }

  useEffect(() => {
    updateInventory();
    let unsubscribe;
    try {
      unsubscribe = onAuthStateChange((user) => {
        setUser(user);
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Error in auth state change:", error);
      setIsLoading(false);
    }
     
    return () => {
      if (unsubscribe) unsubscribe();
    };

  }, []);

  useEffect(() => {
    const filtered = inventory.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredInventory(filtered);
  }, [searchTerm, filterCategory, inventory]);

  const categories = ["all", ...new Set(inventory.map(item => item.category || "uncategorized"))];
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleSignUp = async () => {
    try {
      const userCredential = await signUp(email, password);
      setUser(userCredential.user);
      setAuthError(null);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleSignIn = async () => {
    try {
      const userCredential = await signIn(email, password);
      setUser(userCredential.user);
      setAuthError(null);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogOut = async () => {
    try {
      await logOut();
      setAuthError(null);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return ( 
    <Box 
    width="100vw" 
    height="100vh" 
    display="flex" 
    flexDirection="column"
    justifyContent="center" 
    alignItems="center" 
    gap={2}
    bgcolor="#e6f3ff"
  >
    {!user ? (
        <Box textAlign="center">
          <Typography variant="h2" gutterBottom>
          Inventory Organizer
        </Typography>
        <Typography variant="h5" gutterBottom>
          Organize your inventory for free
        </Typography>
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={handleSignUp}>Sign Up</Button>
          <Button onClick={handleSignIn}>Sign In</Button>
          {authError && <Typography color="error">{authError}</Typography>}
        </Box>
      ) : (
        <Box>
          <Typography>Welcome, {user.email}</Typography>
          <Button onClick={handleLogOut}>Log Out</Button>
        </Box>
      )
    }
    <Modal open={open} onClose={handleClose}>
      <Box
      position="absolute"
      top="50%"
      left="50%"
      width={400}
      bgcolor="white"
      border="2px solid #000"
      boxShadow={24}
      p={4}
      display="flex"
      flexDirection="column"
      gap={3}
      sx={{
        transform: "translate(-50%, -50%)",
      }}
      >
        <Typography variant="h6">Add Item</Typography>
        <Stack width="100%" direction="row" spacing={2}>
          <TextField
          variant="outlined"
          fullWidth
          value={itemName}
          onChange={(e) => {
            setItemName(e.target.value)
          }}
          />
          <Button 
          variant="outlined"
          onClick={()=>{
            addItem(itemName);
            setItemName("");
            handleClose();
          }}>Add</Button>
        </Stack>
      </Box>
    </Modal>
      {user && (
        <>
        <Box display="flex" gap={2} mb={2}>
            <TextField
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </Box>
          <Button 
          variant="outlined" 
          onClick={()=>{
            handleOpen();
          }}
      >
        Add New Item
      </Button>
      <Box border="1px solid #333">
        <Box
        width="800px"
        height="100px"
        bgcolor="#FFFF00"
        display="flex"
        alignItems="center"
        justifyContent="center"
        >
          <Typography variant="h2" color="#333">
            Inventory Items
            </Typography>
        </Box>
      
      <Stack width="800px" height="400px" spacing={1} overflow="auto">
        {
          filteredInventory.map(({name, quantity, description, price, category})=>(
            <Box 
            key={name} 
            width="100%"
            minHeight="80px"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            bgcolor="#f0f0f0"
            padding={5}
            onClick={() => handleItemClick({name, quantity, description, price, category})}
            >
                      <Typography variant="h6">{name}</Typography>
                      <Typography>Quantity: {quantity}</Typography>
                      <Stack direction="row" spacing={2}>
                      <Button variant="contained" onClick={(e) => {
            e.stopPropagation();
            addItem(name);
          }}>
            Add
          </Button>
          <Button variant="contained" onClick={(e) => {
            e.stopPropagation();
            removeItem(name);
          }}>
            Remove
          </Button>
          <Button variant="contained" onClick={(e) => {
            e.stopPropagation();
            setSelectedItem({name, quantity, description, price, category});
            setEditMode(true);
          }}>
            Edit
          </Button>
        </Stack>
              <Dialog open={!!selectedItem} onClose={() => {
  if (!editMode) {
    setSelectedItem(null);
    setEditMode(false);
  }
        }}>
      <DialogTitle>{editMode ? "Edit Item" : "Item Details"}</DialogTitle>
      <DialogContent  onClick={(e) => e.stopPropagation()}>
        <Stack spacing={2}>
          <Typography>Name: {selectedItem?.name}</Typography>
          <TextField
            label="Quantity"
            type="number"
            value={selectedItem?.quantity || 0}
            onChange={(e) => setSelectedItem({...selectedItem, quantity: parseInt(e.target.value)})}
            disabled={!editMode}
          />
          <TextField
            label="Description"
            value={selectedItem?.description || ""}
            onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})}
            disabled={!editMode}
          />
          <TextField
            label="Price"
            type="number"
            value={selectedItem?.price || 0}
            onChange={(e) => setSelectedItem({...selectedItem, price: parseFloat(e.target.value)})}
            disabled={!editMode}
          />
          <TextField
            label="Category"
            value={selectedItem?.category || ""}
            onChange={(e) => setSelectedItem({...selectedItem, category: e.target.value})}
            disabled={!editMode}
          />
                </Stack>
                </DialogContent>
      <DialogActions>
      {editMode ? (
          <>
            <Button onClick={handleEditSave}>Save</Button>
            <Button onClick={() => setEditMode(false)}>Cancel</Button>
          </>
        ) : (
          <>
<Button onClick={(e) => {
          e.stopPropagation();
          setEditMode(true);
        }}>Edit</Button>
        <Button onClick={() => {
          setSelectedItem(null);
          setEditMode(false);
        }}>Close</Button>
          </>
        )}
      </DialogActions>
      </Dialog>
            </Box>
          ))}
      </Stack>
      </Box>
    </>
  )}
  </Box>
    )
  }