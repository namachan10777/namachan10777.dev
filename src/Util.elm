module Util exposing (keyDecoder, toKeyValue)

import Json.Decode as Decode
import Types exposing (..)


keyDecoder : Decode.Decoder KeyValue
keyDecoder =
    Decode.map toKeyValue (Decode.field "key" Decode.string)


toKeyValue : String -> KeyValue
toKeyValue string =
    case String.uncons string of
        Just ( ' ', "" ) ->
            Control "Space"

        Just ( char, "" ) ->
            Character char

        _ ->
            Control string
