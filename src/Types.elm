module Types exposing (..)


type KeyValue
    = Character Char
    | Control String


type alias Keys =
    List KeyValue
