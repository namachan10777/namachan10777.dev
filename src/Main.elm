module Main exposing (Model)

import Browser
import Browser.Events
import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (src)
import Json.Decode as Decode
import Types exposing (KeyValue)
import Util


main : Program () Model Msg
main =
    Browser.element { init = init, update = update, view = view, subscriptions = subscriptions }



-- MODEL


type Hist
    = Help
    | Name
    | Icon
    | Error String


type alias Model =
    { current : String
    , hists : List Hist
    }


type Msg
    = Type KeyValue


init : () -> ( Model, Cmd Msg )
init _ =
    ( { current = ""
      , hists = []
      }
    , Cmd.none
    )



-- UPDATE


decode : String -> Hist
decode acc =
    case acc of
        "help" ->
            Help

        "name" ->
            Name

        "icon" ->
            Icon

        err ->
            Error err


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Type (Types.Character c) ->
            ( { model | current = model.current ++ String.fromChar c }, Cmd.none )

        Type (Types.Control "Enter") ->
            ( { model | current = "", hists = decode model.current :: model.hists }, Cmd.none )

        Type (Types.Control "Backspace") ->
            ( { model | current = String.left (String.length model.current - 1) model.current }, Cmd.none )

        Type (Types.Control _) ->
            ( model, Cmd.none )



-- VIEW


renderHists hists =
    List.map
        (\hist ->
            case hist of
                Help ->
                    div [] [ text "type \"name\" or \"icon\"" ]

                Name ->
                    div [] [ text "Nakano Masaki" ]

                Icon ->
                    img [ src "./res/icon.jpg" ] []

                Error s ->
                    div [] [ text s ]
        )
        hists


view : Model -> Html Msg
view model =
    div []
        (List.append (renderHists model.hists) [ text model.current ])



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Browser.Events.onKeyDown (Decode.map Type Util.keyDecoder)
        ]
