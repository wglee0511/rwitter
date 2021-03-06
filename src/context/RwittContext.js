import React, { createContext, useContext, useEffect, useState } from "react";
import { firebaseFirestore, firebaseStorage } from "../firebaseInit";
import { LoginUserContext } from "./LoginUserContext";
import { v4 as uuidv4 } from "uuid";

const RwittContext = createContext();

const RwittContextProvider = (props) => {
  const [textRwitt, setTextRwitt] = useState("");
  const [textRwitts, setTextRwitts] = useState(null);
  const [stringImage, setStringImage] = useState(null);
  const LoginUserValue = useContext(LoginUserContext);
  const { currentUserInfo } = LoginUserValue;

  useEffect(() => {
    firebaseFirestore
      .collection("rwitts")
      .orderBy("createAt", "desc")
      .onSnapshot((eachSnapShot) => {
        const rwittArr = eachSnapShot.docs.map((each) => {
          return {
            id: each.id,
            ...each.data(),
          };
        });
        setTextRwitts(rwittArr);
      });
  }, []);

  const onRrittSubmit = async (event) => {
    event.preventDefault();
    let imageUrl = null;
    if (stringImage !== null) {
      const checkBucket = firebaseStorage
        .ref()
        .child(`${currentUserInfo.uid}/${uuidv4()}`);
      const uploadStringImage = await checkBucket.putString(
        stringImage,
        "data_url"
      );
      imageUrl = await uploadStringImage.ref.getDownloadURL();
    }
    await firebaseFirestore.collection("rwitts").add({
      userId: currentUserInfo.uid,
      createAt: Date.now(),
      text: textRwitt,
      imageUrl,
    });
    setTextRwitt("");
    setStringImage(null);
  };

  const onChangeRwitt = (event) => {
    const text = event.target.value;
    setTextRwitt(text);
  };

  const onDeleteClick = async (event) => {
    const rwittId = event.target.parentElement.getAttribute("postid");
    const rwittUrl = event.target.parentElement.getAttribute("posturl");

    const isOk = window.confirm("정말로 삭제 하시겠습니까?");
    if (isOk) {
      await firebaseFirestore.doc(`rwitts/${rwittId}`).delete();
      {
        rwittUrl && (await firebaseStorage.refFromURL(rwittUrl).delete());
      }
    }
  };

  const onFIleChange = (event) => {
    const {
      target: { files },
    } = event;
    const theFile = files[0];
    const reader = new FileReader();

    if (theFile) {
      reader.onload = () => setStringImage(reader.result);
      reader.readAsDataURL(theFile);
    }
  };

  const onFileClear = () => setStringImage(null);

  const rwittValue = {
    textRwitt,
    textRwitts,
    onRrittSubmit,
    onChangeRwitt,
    onDeleteClick,
    onFIleChange,
    stringImage,
    onFileClear,
  };

  return (
    <RwittContext.Provider value={rwittValue}>
      {props.children}
    </RwittContext.Provider>
  );
};

export { RwittContextProvider, RwittContext };
