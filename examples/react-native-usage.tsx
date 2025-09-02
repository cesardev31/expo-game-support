// Ejemplo de uso de expo-game-support en React Native/Expo
import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Dimensions, PanResponder } from "react-native";
import { GameEngine } from "../src/core/GameEngine";
import { GameObject } from "../src/core/GameObject";
import { Vector2D } from "../src/math/Vector2D";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ReactNativeGameExample() {
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);

  useEffect(() => {
    initializeGame();
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }
    };
  }, []);

  const initializeGame = () => {
    // Crear motor del juego
    const gameEngine = new GameEngine({
      width: screenWidth,
      height: screenHeight,
      gravity: new Vector2D(0, 981), // Gravedad hacia abajo
      gameLoop: {
        targetFPS: 60,
        maxDeltaTime: 0.016,
        enableFixedTimeStep: true,
      },
    });

    gameEngineRef.current = gameEngine;

    // Crear objetos del juego
    const player = new GameObject({
      id: "player",
      position: new Vector2D(screenWidth / 2, screenHeight - 100),
      size: new Vector2D(50, 50),
      physics: {
        mass: 1,
        velocity: new Vector2D(0, 0),
        acceleration: new Vector2D(0, 0),
        friction: 0.8,
        restitution: 0.3,
        isStatic: false,
      },
    });

    gameEngine.addGameObject(player);

    // Configurar callbacks
    gameEngine.onUpdate((deltaTime) => {
      // Actualizar lógica del juego
      const objects = gameEngine.getAllGameObjects();
      setGameObjects([...objects]);
    });

    gameEngine.onTouch("player-control", (touchEvent) => {
      if (touchEvent.type === "start" || touchEvent.type === "move") {
        const player = gameEngine.getGameObject("player");
        if (player) {
          const force = new Vector2D(
            (touchEvent.position.x - player.position.x) * 10,
            0
          );
          player.applyForce(force);
        }
      }
    });

    gameEngine.onGesture("player-gestures", (gesture) => {
      const player = gameEngine.getGameObject("player");
      if (!player) return;

      switch (gesture.type) {
        case "tap":
          // Salto
          player.applyImpulse(new Vector2D(0, -300));
          break;
        case "swipe":
          // Movimiento direccional
          if (gesture.direction) {
            const force = gesture.direction.multiply(500);
            player.applyForce(force);
          }
          break;
      }
    });

    gameEngine.initialize();
    gameEngine.start();
  };

  // Configurar PanResponder para manejar eventos táctiles
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      if (gameEngineRef.current) {
        gameEngineRef.current.handleTouchStart(evt.nativeEvent);
      }
    },

    onPanResponderMove: (evt) => {
      if (gameEngineRef.current) {
        gameEngineRef.current.handleTouchMove(evt.nativeEvent);
      }
    },

    onPanResponderRelease: (evt) => {
      if (gameEngineRef.current) {
        gameEngineRef.current.handleTouchEnd(evt.nativeEvent);
      }
    },

    onPanResponderTerminate: (evt) => {
      if (gameEngineRef.current) {
        gameEngineRef.current.handleTouchCancel(evt.nativeEvent);
      }
    },
  });

  // Renderizar objetos del juego
  const renderGameObjects = () => {
    return gameObjects.map((obj) => (
      <View
        key={obj.id}
        style={[
          styles.gameObject,
          {
            left: obj.position.x - obj.size.x / 2,
            top: obj.position.y - obj.size.y / 2,
            width: obj.size.x,
            height: obj.size.y,
            backgroundColor: obj.id === "player" ? "#00FF00" : "#FF0000",
          },
        ]}
      />
    ));
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {renderGameObjects()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  gameObject: {
    position: "absolute",
    borderRadius: 5,
  },
});
